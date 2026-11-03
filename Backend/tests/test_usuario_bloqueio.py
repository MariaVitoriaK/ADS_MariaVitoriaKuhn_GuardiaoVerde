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


if __name__ == '__main__':
    unittest.main()
