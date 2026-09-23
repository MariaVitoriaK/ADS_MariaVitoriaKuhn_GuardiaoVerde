from sqlalchemy import Column, Integer, String, Text, DateTime, Date, Numeric, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
from app.database import Base

# Enums baseados no seu diagrama (para a tabela USUARIO)
class TipoUsuario(enum.Enum):
    usuario = "usuario"
    administrador = "administrador"

class StatusUsuario(enum.Enum):
    ativo = "ativo"
    inativo = "inativo"
    banido = "banido"

class Usuario(Base):
    __tablename__ = "usuario"
    id_usuario = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    senha_hash = Column(String, nullable=False)
    foto_perfil = Column(String)
    tipo_usuario = Column(Enum(TipoUsuario), default=TipoUsuario.usuario)
    status = Column(Enum(StatusUsuario), default=StatusUsuario.ativo)
    data_cadastro = Column(DateTime)

class Denuncia(Base):
    __tablename__ = "denuncia"
    id_denuncia = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"))
    titulo = Column(String)
    descricao = Column(Text)
    categoria = Column(String)
    localizacao = Column(String)
    cidade = Column(String)
    estado = Column(String)
    latitude = Column(Numeric)
    longitude = Column(Numeric)
    data_ocorrencia = Column(Date)
    gravidade = Column(String)
    status = Column(String)
    data_registro = Column(DateTime)

class HistoricoDenuncia(Base):
    __tablename__ = "historico_denuncia"
    id_historico = Column(Integer, primary_key=True, index=True)
    id_denuncia = Column(Integer, ForeignKey("denuncia.id_denuncia"))
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"))
    status_anterior = Column(String)
    novo_status = Column(String)
    observacao = Column(Text)
    data_alteracao = Column(DateTime)

class Foto(Base):
    __tablename__ = "foto"
    id_foto = Column(Integer, primary_key=True, index=True)
    id_area = Column(Integer, ForeignKey("area_restauracao.id_area"), nullable=True)
    id_denuncia = Column(Integer, ForeignKey("denuncia.id_denuncia"), nullable=True)
    url_foto = Column(String)
    data_upload = Column(DateTime)
    descricao = Column(String)

class AreaRestauracao(Base):
    __tablename__ = "area_restauracao"
    id_area = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"))
    nome = Column(String)
    descricao = Column(Text)
    localizacao = Column(String)
    cidade = Column(String)
    estado = Column(String)
    bioma = Column(String)
    area_aproximada = Column(Numeric)
    motivo = Column(Text)
    percentual_progresso = Column(Numeric)
    status = Column(String)
    data_cadastro = Column(DateTime)

class AcaoRestauracao(Base):
    __tablename__ = "acao_restauracao"
    id_acao = Column(Integer, primary_key=True, index=True)
    id_area = Column(Integer, ForeignKey("area_restauracao.id_area"))
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"))
    descricao = Column(Text)
    data_acao = Column(Date)
    percentual_progresso = Column(Numeric)

class Noticia(Base):
    __tablename__ = "noticia"
    id_noticia = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"))
    titulo = Column(String)
    conteudo = Column(Text)
    imagem = Column(String)
    data_publicacao = Column(DateTime)
    status = Column(String)

class Comentario(Base):
    __tablename__ = "comentario"
    id_comentario = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"))
    id_noticia = Column(Integer, ForeignKey("noticia.id_noticia"))
    texto = Column(Text)
    data_comentario = Column(DateTime)
    status = Column(String)

class Curtida(Base):
    __tablename__ = "curtida"
    id_curtida = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"))
    id_noticia = Column(Integer, ForeignKey("noticia.id_noticia"))
    data_curtida = Column(DateTime)

class ONG(Base):
    __tablename__ = "ong"
    id_ong = Column(Integer, primary_key=True, index=True)
    id_usuario_cadastro = Column(Integer, ForeignKey("usuario.id_usuario"))
    nome = Column(String)
    descricao = Column(Text)
    area_atuacao = Column(String)
    site = Column(String)
    link_doacao = Column(String)
    redes_sociais = Column(String)
    status = Column(String)
    data_cadastro = Column(DateTime)