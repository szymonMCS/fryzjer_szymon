import httpx
from datetime import date
from typing import Optional
from src.config import settings

class EmailService:
    def __init__(self):
        self.api_key = settings.BREVO_API_KEY
        self.sender_email = settings.BREVO_SENDER_EMAIL
        self.sender_name = settings.BREVO_SENDER_NAME
        
    async def send_booking_confirmation(
        self, 
        to_email: str, 
        customer_name: str, 
        service_name: str,
        booking_date: date,
        booking_time: str,
        confirmation_code: str
    ) -> bool:
        if not self.api_key:
            print("BREVO_API_KEY nie ustawiony - email nie został wysłany")
            return False
            
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.brevo.com/v3/smtp/email",
                    headers={
                        "api-key": self.api_key,
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    json={
                        "sender": {
                            "name": self.sender_name,
                            "email": self.sender_email
                        },
                        "to": [{"email": to_email, "name": customer_name}],
                        "subject": f"Potwierdzenie rezerwacji - {booking_date.strftime('%d.%m.%Y')} {booking_time}",
                        "htmlContent": self._build_confirmation_html(
                            customer_name, service_name, booking_date, booking_time, confirmation_code
                        )
                    },
                    timeout=10.0
                )
                if response.status_code == 201:
                    print(f"Email wysłany do {to_email}")
                    return True
                else:
                    print(f"Błąd Brevo API: {response.status_code} - {response.text}")
                    return False           
        except Exception as e:
            print(f"Błąd wysyłania emaila: {e}")
            return False
    
    def _build_confirmation_html(
        self, 
        name: str, 
        service: str, 
        booking_date: date, 
        time: str, 
        code: str
    ) -> str:
        return f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #2c3e50;">Witaj {name}!</h2>
            <p>Twoja wizyta została pomyślnie zarezerwowana.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
                <h3 style="margin-top: 0; color: #007bff;">Szczegóły wizyty:</h3>
                <ul style="list-style: none; padding: 0; line-height: 1.8;">
                    <li>✂️ <strong>Usługa:</strong> {service}</li>
                    <li>📅 <strong>Data:</strong> {booking_date.strftime('%d.%m.%Y')}</li>
                    <li>🕐 <strong>Godzina:</strong> {time}</li>
                    <li>🔑 <strong>Kod potwierdzenia:</strong> <code style="background: #e9ecef; padding: 2px 6px; border-radius: 4px;">{code}</code></li>
                </ul>
            </div>
            
            <p style="background: #fff3cd; padding: 15px; border-radius: 4px; color: #856404;">
                <strong>Ważne:</strong> Aby anulować rezerwację, użyj kodu powyżej na stronie salonu lub skontaktuj się z nami telefonicznie.
            </p>
            
            <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">
                Pozdrawiamy,<br>
                <strong>{self.sender_name}</strong>
            </p>
        </div>
        """

email_service = EmailService()