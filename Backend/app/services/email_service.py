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
        print(f"[EMAIL] SMTP_HOST não configurado. E-mail para {recipient} não foi enviado: {subject}")
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
        print(f"[EMAIL] E-mail enviado com sucesso para {recipient}: {subject}")
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


def send_email_verification_email(recipient: str, verification_code_or_link: str, user_name: str, verification_link: str | None = None) -> bool:
    subject = "Verifique seu e-mail no Guardião Verde"
    verification_code = verification_code_or_link if verification_code_or_link and verification_code_or_link.isdigit() and len(verification_code_or_link) == 6 else None
    body_lines = [
        f"Olá {user_name},",
        "",
        "Para receber atualizações sobre denúncias e notícias, confirme seu e-mail.",
        "",
    ]
    if verification_code:
        body_lines.append(f"Seu código de verificação é: {verification_code}")
    if verification_link:
        body_lines.append(f"Ou acesse este link: {verification_link}")
    body_lines.extend([
        "",
        "Caso você não tenha solicitado essa verificação, ignore este e-mail.",
    ])
    return send_email(subject, recipient, "\n".join(body_lines))
