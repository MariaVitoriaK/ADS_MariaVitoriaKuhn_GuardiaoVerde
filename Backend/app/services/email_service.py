import os
import smtplib
import ssl
from email.message import EmailMessage


def send_email(subject: str, recipient: str, body: str) -> bool:
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM", smtp_user or "noreply@localhost")
    use_tls = os.getenv("SMTP_USE_TLS", "true").lower() == "true"

    if not smtp_host:
        print(f"[EMAIL] SMTP não configurado. E-mail para {recipient} em fila de envio: {subject}")
        print(body)
        return False

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = smtp_from
    message["To"] = recipient
    message.set_content(body)

    context = ssl.create_default_context()
    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as server:
            if use_tls:
                server.starttls(context=context)
            if smtp_user and smtp_password:
                server.login(smtp_user, smtp_password)
            server.send_message(message)
        return True
    except Exception as exc:  # pragma: no cover - depends on SMTP environment
        print(f"[EMAIL] Falha ao enviar e-mail para {recipient}: {exc}")
        return False


def send_report_status_email(recipient: str, report_title: str, new_status: str, description: str) -> bool:
    subject = f"Atualização da sua denúncia: {report_title}"
    body = (
        f"Olá,\n\n"
        f"A sua denúncia '{report_title}' teve o status atualizado para: {new_status}.\n\n"
        f"Descrição do administrador:\n{description}\n\n"
        "Atenciosamente,\n"
        "Guardião Verde"
    )
    return send_email(subject, recipient, body)


def send_email_verification_email(recipient: str, verification_link: str, user_name: str) -> bool:
    subject = "Verifique seu e-mail no Guardião Verde"
    body = (
        f"Olá {user_name},\n\n"
        "Para receber atualizações sobre denúncias e notícias, confirme seu e-mail.\n\n"
        f"Clique no link abaixo:\n{verification_link}\n\n"
        "Caso você não tenha solicitado essa verificação, ignore este e-mail."
    )
    return send_email(subject, recipient, body)
