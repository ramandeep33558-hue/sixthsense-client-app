// @ts-nocheck
import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en" style={{ height: "100%" }}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, maximum-scale=5"
        />
        
        {/* Primary Meta Tags */}
        <title>Sixth Sense Psychics - Live Psychic Readings & Spiritual Guidance</title>
        <meta name="title" content="Sixth Sense Psychics - Live Psychic Readings & Spiritual Guidance" />
        <meta name="description" content="Connect with gifted psychic advisors for guidance on love, career, life path, and more. Get live psychic readings via chat, phone, or video 24/7. 500+ verified psychics. First reading free!" />
        <meta name="keywords" content="psychic readings, online psychic, tarot reading, love psychic, career guidance, spiritual advisor, clairvoyant, medium, astrology, horoscope, live psychic chat, phone psychic, video psychic reading, free psychic reading" />
        <meta name="author" content="Sixth Sense Psychics" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        
        {/* Theme & PWA */}
        <meta name="theme-color" content="#9C27B0" />
        <meta name="msapplication-TileColor" content="#9C27B0" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Sixth Sense Psychics" />
        <meta name="application-name" content="Sixth Sense Psychics" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Sixth Sense Psychics" />
        <meta property="og:title" content="Sixth Sense Psychics - Live Psychic Readings & Spiritual Guidance" />
        <meta property="og:description" content="Connect with gifted psychic advisors for guidance on love, career, life path, and more. Get live psychic readings via chat, phone, or video 24/7. 500+ verified psychics." />
        <meta property="og:image" content="https://customer-assets.emergentagent.com/job_42069a8a-9a70-44df-94f4-f6571c6ab514/artifacts/ficttj0r_IMG_4688.jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Sixth Sense Psychics - Spiritual Guidance" />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@sixthsensepsychics" />
        <meta name="twitter:creator" content="@sixthsensepsychics" />
        <meta name="twitter:title" content="Sixth Sense Psychics - Live Psychic Readings" />
        <meta name="twitter:description" content="Connect with gifted psychic advisors for guidance on love, career, life path, and more. Get live psychic readings 24/7." />
        <meta name="twitter:image" content="https://customer-assets.emergentagent.com/job_42069a8a-9a70-44df-94f4-f6571c6ab514/artifacts/ficttj0r_IMG_4688.jpeg" />
        
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://customer-assets.emergentagent.com" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://customer-assets.emergentagent.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        
        {/* Structured Data - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Sixth Sense Psychics",
              "description": "Connect with gifted psychic advisors for guidance on love, career, life path, and more.",
              "logo": "https://customer-assets.emergentagent.com/job_42069a8a-9a70-44df-94f4-f6571c6ab514/artifacts/ficttj0r_IMG_4688.jpeg",
              "sameAs": [
                "https://facebook.com/sixthsensepsychics",
                "https://instagram.com/sixthsensepsychics",
                "https://twitter.com/sixthsensepsychics"
              ]
            })
          }}
        />
        
        {/* Structured Data - Service */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Service",
              "name": "Live Psychic Readings",
              "provider": {
                "@type": "Organization",
                "name": "Sixth Sense Psychics"
              },
              "serviceType": "Psychic Reading",
              "description": "Get live psychic readings via chat, phone, or video from verified spiritual advisors",
              "offers": {
                "@type": "Offer",
                "name": "Free First Reading",
                "description": "First 4 minutes free for new members",
                "price": "0",
                "priceCurrency": "USD"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "reviewCount": "10000",
                "bestRating": "5",
                "worstRating": "1"
              }
            })
          }}
        />
        
        {/* Structured Data - FAQ */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "How do I get a psychic reading?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Sign up for a free account, browse our verified psychic advisors, and connect via live chat, phone, or video. New members receive their first 4 minutes free!"
                  }
                },
                {
                  "@type": "Question",
                  "name": "Are the psychics verified?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, all our psychics go through a rigorous verification process. We have over 500 verified advisors with an average rating of 4.8 stars."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What types of readings are available?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "We offer tarot readings, astrology, love & relationship guidance, career advice, mediumship, and more via live chat, phone calls, and video sessions."
                  }
                }
              ]
            })
          }}
        />

        {/*
          Disable body scrolling on web to make ScrollView components work correctly.
          If you want to enable scrolling, remove `ScrollViewStyleReset` and
          set `overflow: auto` on the body style below.
        */}
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              body > div:first-child { position: fixed !important; top: 0; left: 0; right: 0; bottom: 0; }
              [role="tablist"] [role="tab"] * { overflow: visible !important; }
              [role="heading"], [role="heading"] * { overflow: visible !important; }
              
              /* Smooth scrolling */
              html { scroll-behavior: smooth; }
              
              /* Better touch action for mobile */
              * { touch-action: manipulation; }
              
              /* Focus styles for accessibility */
              :focus-visible {
                outline: 2px solid #9C27B0;
                outline-offset: 2px;
              }
            `,
          }}
        />
      </head>
      <body
        style={{
          margin: 0,
          height: "100%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </body>
    </html>
  );
}
