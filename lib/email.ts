type EmailParams = {
  userName: string;
  userPhone?: string;
  userEmail?: string;
};

export async function sendNewUserEmail({ userName, userPhone, userEmail }: EmailParams) {
  // Verify API key is available
  const apiKey = process.env.NEXT_PUBLIC_BREVO_API_KEY;
  if (!apiKey) {
    console.error('Missing NEXT_PUBLIC_BREVO_API_KEY environment variable');
    throw new Error('Brevo API key is not configured');
  }

  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
      <div style="text-align: center; padding: 20px 0; background-color: #f8f9fa; margin-bottom: 20px;">
        <h1 style="color: #333; margin: 0;">New Member Registration</h1>
        <p style="color: #666; margin: 10px 0 0;">Bodyshake Fitness Center</p>
      </div>

      <div style="padding: 20px; background-color: #ffffff;">
        <p style="color: #444; font-size: 16px; line-height: 1.5;">
          A new member has registered at Bodyshake Fitness Center. Please find their details below:
        </p>

        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 10px 0;"><strong>Member Name:</strong> ${userName}</p>
          ${userPhone ? `<p style="margin: 10px 0;"><strong>Phone Number:</strong> ${userPhone}</p>` : ''}
          ${userEmail ? `<p style="margin: 10px 0;"><strong>Email Address:</strong> ${userEmail}</p>` : ''}
          <p style="margin: 10px 0;"><strong>Registration Date:</strong> ${new Date().toLocaleString()}</p>
        </div>

        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          Please ensure to:
          <ul style="color: #666; font-size: 14px;">
            <li>Update the member's information in the system</li>
            <li>Schedule an orientation session if needed</li>
            <li>Provide necessary access credentials</li>
          </ul>
        </p>
      </div>

      <div style="text-align: center; padding: 20px; background-color: #f8f9fa; margin-top: 20px; font-size: 12px; color: #666;">
        <p>This is an automated message from Bodyshake Fitness Center Management System</p>
        <p>Registration Time: ${new Date().toLocaleString()}</p>
      </div>
    </div>
  `;

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: {
          name: 'Bodyshake Fitness Center management',
          email: 'bodyshakefitnesscenter@gmail.com'
        },
        to: [{
          email: 'bodyshakefitnesscenter@gmail.com',
          name: 'Gym Admin'
        }],
        subject: 'New User Registration Alert',
        htmlContent: emailContent
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.code === 'unauthorized' && errorData.message.includes('unrecognised IP address')) {
        throw new Error(`Unauthorized IP address. Please add ${errorData.message.match(/\d+\.\d+\.\d+\.\d+/)[0]} to your Brevo authorized IPs at https://app.brevo.com/security/authorised_ips`);
      }
      throw new Error(`Brevo API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    return response.json();
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
}