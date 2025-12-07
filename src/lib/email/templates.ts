import { sendEmail } from "./resend"

export async function sendVerificationEmail({
  to,
  url,
  userName,
}: {
  to: string
  url: string
  userName: string
}) {
  const subject = "Vérifie ton adresse email - JobTrackr"
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">JobTrackr</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
          <h2 style="color: #111827; margin-top: 0;">Bonjour ${userName} 👋</h2>
          <p style="color: #4b5563; font-size: 16px;">
            Merci de t'être inscrit sur JobTrackr ! Pour finaliser ton inscription, 
            tu dois vérifier ton adresse email en cliquant sur le bouton ci-dessous.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Vérifier mon email
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Si le bouton ne fonctionne pas, copie et colle ce lien dans ton navigateur :
          </p>
          <p style="color: #667eea; font-size: 12px; word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px;">
            ${url}
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">
            Ce lien expire dans 24 heures. Si tu n'as pas créé de compte sur JobTrackr, 
            tu peux ignorer cet email.
          </p>
        </div>
      </body>
    </html>
  `

  const text = `
Bonjour ${userName},

Merci de t'être inscrit sur JobTrackr ! Pour finaliser ton inscription, 
tu dois vérifier ton adresse email en cliquant sur le lien ci-dessous :

${url}

Ce lien expire dans 24 heures. Si tu n'as pas créé de compte sur JobTrackr, 
tu peux ignorer cet email.

L'équipe JobTrackr
  `

  return sendEmail({ to, subject, html, text })
}

export async function sendResetPasswordEmail({
  to,
  url,
  userName,
}: {
  to: string
  url: string
  userName: string
}) {
  const subject = "Réinitialise ton mot de passe - JobTrackr"
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">JobTrackr</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
          <h2 style="color: #111827; margin-top: 0;">Bonjour ${userName} 👋</h2>
          <p style="color: #4b5563; font-size: 16px;">
            Tu as demandé à réinitialiser ton mot de passe. Clique sur le bouton ci-dessous 
            pour créer un nouveau mot de passe.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Réinitialiser mon mot de passe
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Si le bouton ne fonctionne pas, copie et colle ce lien dans ton navigateur :
          </p>
          <p style="color: #667eea; font-size: 12px; word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px;">
            ${url}
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">
            Ce lien expire dans 1 heure. Si tu n'as pas demandé à réinitialiser ton mot de passe, 
            tu peux ignorer cet email. Ton mot de passe ne sera pas modifié.
          </p>
        </div>
      </body>
    </html>
  `

  const text = `
Bonjour ${userName},

Tu as demandé à réinitialiser ton mot de passe. Clique sur le lien ci-dessous 
pour créer un nouveau mot de passe :

${url}

Ce lien expire dans 1 heure. Si tu n'as pas demandé à réinitialiser ton mot de passe, 
tu peux ignorer cet email. Ton mot de passe ne sera pas modifié.

L'équipe JobTrackr
  `

  return sendEmail({ to, subject, html, text })
}

