## NotificationTemplate

Metadata definition for notification templates and delivery settings.

### Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | Unique identifier for the entity instance. | string | Yes |
| code_name | Unique identifier name for the notification | string | Yes |
| title | The display name of the notification template that appears in the staff portal notification settings. This is what users see when browsing available notification options (e.g., "Payment Received Notification"). | ref to localizedTextList | Yes |
| description | A brief explanation that appears in the staff portal notification settings to help them understand what this notification is for and when it will be triggered. | ref to localizedTextList | Yes |
| category | The functional category this notification belongs to (e.g., "payments", "booking", "documents"). | string (enum: `payments`, `clients`, `calendar`, `booking`, `marketing`, `teamchat`, `scheduling`, `advertising`, `group_events`, `documents`, `messages`, `reviews`, `social`, `account`) | Yes |
| configurable_by_staff | Boolean flag that determines whether staff members can customize or modify this notification template through the staff portal. | boolean | Yes |
| delivery_channel | List of delivery channels for the notification. | array<string> | Yes |
| trigger_type | Type of trigger for the notification. | string (enum: `system`, `client`) | Yes |
| content | Notification content for 'email' and/or 'staff_portal'. | object | Yes |
| created_at | ISO8601 timestamp of when the entity was created. | string | Yes |
| updated_at | ISO8601 timestamp of the last update to the entity. | string | Yes |

**Required fields**: `uid`, `code_name`, `title`, `description`, `category`, `configurable_by_staff`, `delivery_channel`, `trigger_type`, `content`, `created_at`, `updated_at`

### Content Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| staff_portal |  | object |  |
| email |  | object |  |

### Example

JSON

```json
{
  "uid": "notif-001",
  "code_name": "welcome_new_user",
  "title": [
    {
      "locale": "en",
      "value": "Welcome Notification"
    },
    {
      "locale": "fr",
      "value": "Notification de bienvenue"
    },
    {
      "locale": "de",
      "value": "Willkommensbenachrichtigung"
    }
  ],
  "description": [
    {
      "locale": "en",
      "value": "Sent to new users upon registration."
    },
    {
      "locale": "fr",
      "value": "Envoyé aux nouveaux utilisateurs lors de l'inscription."
    },
    {
      "locale": "es",
      "value": "Enviado a los nuevos usuarios al registrarse."
    }
  ],
  "category": "account",
  "configurable_by_staff": true,
  "delivery_channel": [
    "push",
    "email"
  ],
  "trigger_type": "system",
  "content": {
    "staff_portal": {
      "title": [
        {
          "locale": "en",
          "value": "Welcome!"
        },
        {
          "locale": "fr",
          "value": "Bienvenue!"
        },
        {
          "locale": "es",
          "value": "¡Bienvenido!"
        }
      ],
      "message_body": [
        {
          "locale": "en",
          "value": "Thanks for joining us!"
        },
        {
          "locale": "fr",
          "value": "Merci de nous avoir rejoints!"
        }
      ],
      "deep_link": "https://example.com/welcome"
    },
    "email": {
      "subject": [
        {
          "locale": "en",
          "value": "Welcome to Our Service"
        },
        {
          "locale": "fr",
          "value": "Bienvenue à notre service"
        },
        {
          "locale": "de",
          "value": "Willkommen bei unserem Service"
        }
      ],
      "top_image": {
        "url": "https://example.com/banner.png",
        "width": 600,
        "alt": [
          {
            "locale": "en",
            "value": "Welcome banner"
          },
          {
            "locale": "fr",
            "value": "Bannière de bienvenue"
          }
        ]
      },
      "main_title": [
        {
          "locale": "en",
          "value": "Hello and Welcome!"
        },
        {
          "locale": "fr",
          "value": "Bonjour et bienvenue!"
        }
      ],
      "main_text": [
        {
          "locale": "en",
          "value": "We're excited to have you on board."
        },
        {
          "locale": "es",
          "value": "Estamos emocionados de tenerte con nosotros."
        }
      ],
      "middle_image": {
        "url": "https://example.com/mid.png",
        "width": 400,
        "alt": [
          {
            "locale": "en",
            "value": "Mid section image"
          },
          {
            "locale": "es",
            "value": "Imagen de la sección media"
          }
        ]
      },
      "middle_text": [
        {
          "locale": "en",
          "value": "Here are some tips to get started."
        },
        {
          "locale": "fr",
          "value": "Voici quelques conseils pour commencer."
        }
      ],
      "footer_text": [
        {
          "locale": "en",
          "value": "Best regards, The Team"
        },
        {
          "locale": "de",
          "value": "Mit freundlichen Grüßen, Das Team"
        }
      ],
      "primary_cta_button": {
        "text": [
          {
            "locale": "en",
            "value": "Get Started"
          },
          {
            "locale": "fr",
            "value": "Commencer"
          }
        ],
        "url": "https://example.com/start",
        "alt": [
          {
            "locale": "en",
            "value": "Start now"
          },
          {
            "locale": "fr",
            "value": "Commencez maintenant"
          }
        ]
      },
      "secondary_cta_button": {
        "text": [
          {
            "locale": "en",
            "value": "Contact Support"
          },
          {
            "locale": "es",
            "value": "Contactar Soporte"
          }
        ],
        "url": "https://example.com/support",
        "alt": [
          {
            "locale": "en",
            "value": "Support"
          },
          {
            "locale": "es",
            "value": "Soporte"
          }
        ]
      }
    }
  },
  "created_at": "2024-06-01T12:00:00Z",
  "updated_at": "2024-06-01T12:00:00Z"
}
```