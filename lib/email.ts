type EmailParams = {
  userName: string;
  userPhone?: string;
  userEmail?: string;
};

export async function sendNewUserEmail({ userName, userPhone, userEmail }: EmailParams) {
  const emailContent = `
    A new user just registered on your platform.

    Name: ${userName}
    ${userPhone ? `Phone: ${userPhone}` : ''}
    ${userEmail ? `Email: ${userEmail}` : ''}
  `.trim();

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'api-key': process.env.NEXT_PUBLIC_BREVO_API_KEY as string,
    },
    body: JSON.stringify({
      sender: {
        name: 'admin@bodyshakefitnesscenter',
        email: 'noreply@yourgym.com'
      },
      to: [{
        email: 'chimerezedawn6@gmail.com',  // Replace with your admin email
        name: 'Gym Admin'
      }],
      subject: 'New User Registration Alert',
      htmlContent: emailContent.replace(/\n/g, '<br>')
    })
  });

  if (!response.ok) {
    throw new Error('Failed to send email notification');
  }

  return response.json();
}