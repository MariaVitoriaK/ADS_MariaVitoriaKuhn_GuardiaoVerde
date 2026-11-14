import unittest
from datetime import datetime, timedelta

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.core.security import atualizar_status_bloqueio_automatico
from app.models.models import Curtida, Noticia, StatusUsuario, Usuario
from app.routers.usuarios import remover_curtidas_do_usuario


class TestUsuarioBloqueio(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine('sqlite:///:memory:')
        Base.metadata.create_all(bind=self.engine)
        self.Session = sessionmaker(bind=self.engine)

    def test_bloqueio_expira_automaticamente(self):
        session = self.Session()
        usuario = Usuario(
            nome='Ana',
            username='ana',
            email='ana@email.com',
            senha_hash='hash',
            status=StatusUsuario.banido,
            bloqueado_ate=datetime.utcnow() - timedelta(days=1),
        )
        session.add(usuario)
        session.commit()

        atualizar_status_bloqueio_automatico(session, usuario)

        self.assertEqual(usuario.status, StatusUsuario.ativo)
        self.assertIsNone(usuario.bloqueado_ate)

    def test_remover_curtidas_antes_de_excluir_conta(self):
        session = self.Session()
        usuario = Usuario(
            nome='Bruno',
            username='bruno',
            email='bruno@email.com',
            senha_hash='hash',
            status=StatusUsuario.ativo,
        )
        noticia = Noticia(
            id_usuario=usuario.id_usuario,
            titulo='Notícia',
            conteudo='Conteúdo',
            data_publicacao=datetime.utcnow(),
            status='publicada',
        )
        session.add_all([usuario, noticia])
        session.commit()

        curtida = Curtida(id_usuario=usuario.id_usuario, id_noticia=noticia.id_noticia, data_curtida=datetime.utcnow())
        session.add(curtida)
        session.commit()

        remover_curtidas_do_usuario(session, usuario.id_usuario)

        curtida_restante = session.query(Curtida).filter(Curtida.id_usuario == usuario.id_usuario).first()
        self.assertIsNone(curtida_restante)

    def test_usuario_exige_username_unico_ignorando_maiusculas(self):
        from fastapi import HTTPException
        from app.routers.usuarios import validar_username

        session = self.Session()
        usuario = Usuario(
            nome='Carla',
            username='carla',
            email='carla@email.com',
            senha_hash='hash',
            status=StatusUsuario.ativo,
        )
        session.add(usuario)
        session.commit()

        self.assertEqual(validar_username('  NOVO.User ', session), 'novo.user')
        with self.assertRaises(HTTPException) as erro:
            validar_username('CARLA', session)
        self.assertEqual(erro.exception.status_code, 409)

    def test_somente_admin_principal_passa_na_dependencia_de_gestao(self):
        from fastapi import HTTPException
        from app.core.security import get_current_primary_admin_user
        from app.models.models import TipoUsuario

        principal = Usuario(
            nome='Administrador',
            username='admin',
            email='admin@email.com',
            senha_hash='hash',
            tipo_usuario=TipoUsuario.administrador,
            administrador_principal=True,
            status=StatusUsuario.ativo,
        )
        secundario = Usuario(
            nome='Alice Torres',
            username='alice.torres',
            email='alice@email.com',
            senha_hash='hash',
            tipo_usuario=TipoUsuario.administrador,
            administrador_principal=False,
            status=StatusUsuario.ativo,
        )

        self.assertIs(get_current_primary_admin_user(principal), principal)
        with self.assertRaises(HTTPException) as erro:
            get_current_primary_admin_user(secundario)
        self.assertEqual(erro.exception.status_code, 403)

    def test_admin_principal_cria_admin_secundario_sem_promover_a_principal(self):
        from app.models.models import TipoUsuario
        from app.routers.usuarios import criar_administrador_secundario
        from app.schemas.usuario import UsuarioAdminCreate

        session = self.Session()
        principal = Usuario(
            nome='Administrador',
            username='admin',
            email='admin@email.com',
            senha_hash='hash',
            tipo_usuario=TipoUsuario.administrador,
            administrador_principal=True,
            status=StatusUsuario.ativo,
        )
        criado = criar_administrador_secundario(
            UsuarioAdminCreate(
                nome='Alice Torres',
                username='alice.torres',
                email='alice@email.com',
                senha='senha-segura-123',
            ),
            session,
            principal,
        )

        self.assertEqual(criado.nome, 'Alice Torres')
        self.assertEqual(criado.username, 'alice.torres')
        self.assertEqual(criado.tipo_usuario, TipoUsuario.administrador)
        self.assertFalse(criado.administrador_principal)

    def test_exclusao_preserva_autoria_de_conteudo(self):
        from app.models.models import Comentario, HistoricoDenuncia
        from app.routers.usuarios import preservar_autorias_antes_de_excluir

        session = self.Session()
        usuario = Usuario(
            nome='Paulo Oliveira',
            username='paulo.oliveira',
            email='paulo@email.com',
            senha_hash='hash',
            status=StatusUsuario.ativo,
        )
        session.add(usuario)
        session.flush()
        noticia = Noticia(
            id_usuario=usuario.id_usuario,
            titulo='Notícia',
            conteudo='Conteúdo',
            data_publicacao=datetime.utcnow(),
            status='publicada',
        )
        session.add(noticia)
        session.flush()
        comentario = Comentario(
            id_usuario=usuario.id_usuario,
            id_noticia=noticia.id_noticia,
            texto='Comentário',
            data_comentario=datetime.utcnow(),
            status='publicado',
        )
        historico = HistoricoDenuncia(
            id_usuario=usuario.id_usuario,
            id_denuncia=1,
            status_anterior='pendente',
            novo_status='aceita',
            data_alteracao=datetime.utcnow(),
        )
        session.add_all([comentario, historico])
        session.commit()

        preservar_autorias_antes_de_excluir(session, usuario)
        session.commit()
        session.refresh(noticia)
        session.refresh(comentario)
        session.refresh(historico)

        self.assertIsNone(noticia.id_usuario)
        self.assertEqual(noticia.autor_nome, 'Paulo Oliveira')
        self.assertEqual(noticia.autor_username, 'paulo.oliveira')
        self.assertIsNone(comentario.id_usuario)
        self.assertEqual(comentario.username_usuario_autor, 'paulo.oliveira')
        self.assertIsNone(historico.id_usuario)
        self.assertEqual(historico.username_admin, 'paulo.oliveira')

    def test_verificacao_email_rejeita_endereco_invalido(self):
        from app.routers.usuarios import validar_email_para_verificacao

        self.assertTrue(validar_email_para_verificacao('usuario@gmail.com'))
        with self.assertRaises(ValueError):
            validar_email_para_verificacao('email-falso')

    def test_geracao_codigo_verificacao_tem_six_digitos(self):
        from app.routers.usuarios import gerar_codigo_verificacao

        codigo = gerar_codigo_verificacao()

        self.assertEqual(len(codigo), 6)
        self.assertTrue(codigo.isdigit())


if __name__ == '__main__':
    unittest.main()
