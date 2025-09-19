import { Url } from "@/@saas-boilerplate/utils";
import { freePlan } from "@/content/plans/free";
import { proPlan } from "@/content/plans/pro";

export const AppConfig = {
  url: process.env.NEXT_PUBLIC_IGNITER_APP_URL || "http://localhost:3000",
  name: process.env.NEXT_PUBLIC_IGNITER_APP_NAME || "SaaS Boilerplate",
  keywords: [
    "SaaS",
    "Boilerplate",
    "Micro-SaaS",
    "SaaS",
    "Boilerplate",
    "Micro-SaaS",
  ],
  theme: "system",
  description: "Transform Your Project into a Successful Micro-SaaS",
  brand: {
    og: "assets/og-image.png",
    logos: {
      icon: {
        dark: "/logo/logo-icon-dark.png",
        light: "/logo/logo-icon-light.png",
      },
      full: {
        dark: "/logo/logo-icon-dark.png",
        light: "/logo/logo-icon-light.png",
      },
    },
  },
  creator: {
    name: "Felipe Barcelos",
    image:
      "https://pbs.twimg.com/profile_images/1745449170293702657/3lqSo1oy_400x400.png",
    links: {
      twitter: "https://twitter.com/feldbarcelospro",
      instagram: "https://www.instagram.com/feldbarcelos/",
      linkedin: "https://www.linkedin.com/in/felipe-barcelos-0b6b7b1b/",
    },
  },
  links: {
    mail: "team@saasboilerplate.com.br",

    site: "/",
    support: "/help",
    terms: "/terms",
    privacy: "/privacy",
    docs: "/docs",
    updates: "/updates",
    blog: "/blog",
    rss: "/rss",

    linkedin: "https://www.linkedin.com/in/",
    twitter: "https://twitter.com/",
    facebook: "https://www.facebook.com/",
    instagram: "https://www.instagram.com/",
    tiktok: "https://www.tiktok.com/",
    threads: "https://www.threads.net/",
  },
  providers: {
    billing: {
      subscription: {
        enabled: true,

        trial: {
          enabled: true,
          duration: 3, // if enabled, duration in days. Minimum is 1 day.
        },

        plans: {
          default: freePlan.slug,
          options: [freePlan, proPlan],
        },
      },
      keys: {
        publishable: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string,
        secret: process.env.STRIPE_SECRET_KEY as string,
        webhook: process.env.STRIPE_WEBHOOK_SECRET as string,
      },
      paths: {
        checkoutCancelUrl: Url.get(
          "/app/settings/organization/billing?state=cancel",
        ),
        checkoutSuccessUrl: Url.get(
          "/app/settings/organization/billing?state=success",
        ),
        portalReturnUrl: Url.get(
          "/app/settings/organization/billing?state=return",
        ),
        endSubscriptionUrl: Url.get("/app/upgrade"),
      },
    },
    mail: {
      from: process.env.MAIL_FROM,
      provider: process.env.MAIL_PROVIDER || "smtp",
      secret: process.env.MAIL_SECRET || "smtp://localhost:1025",
    },
    auth: {
      secret: process.env.IGNITER_APP_SECRET || "default-secret",
      providers: {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID as string,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
        github: {
          clientId: process.env.GITHUB_CLIENT_ID as string,
          clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
        },
      },
    },
    storage: {
      provider: "S3",
      endpoint: process.env.STORAGE_ENDPOINT,
      region: process.env.STORAGE_REGION,
      bucket: process.env.STORAGE_BUCKET,
      path: process.env.STORAGE_PATH,
      accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
      secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY,
      signatureVersion: "v4",
    },
  },
};
