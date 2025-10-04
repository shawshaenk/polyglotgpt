import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./prism.css";
import { ClerkProvider } from "@clerk/nextjs";
import { AppContextProvider } from "@/context/AppContext";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "PolyglotGPT",
  description: "Conversational AI to Learn 50+ Languages",
  keywords: [
    "language learning",
    "AI language learning",
    "polyglot",
    "AI tutor",
    "learn languages",
    "speak languages",
  ],
  authors: [{ name: "PolyglotGPT", url: "https://polyglotgpt.com" }],
  // IMPORTANT: replace this with your production URL
  metadataBase: new URL("https://polyglotgpt.com"),
  openGraph: {
    title: "PolyglotGPT",
    description: "Conversational AI to Learn 50+ Languages",
    url: "https://polyglotgpt.com",
    siteName: "PolyglotGPT",
    images: [
      {
        url: "/polyglotgpt_logo.png",
        alt: "PolyglotGPT logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PolyglotGPT",
    description: "Conversational AI to Learn 50+ Languages",
    images: ["/polyglotgpt_logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
  },
};

// JSON-LD structured data for the homepage (helps rich results). Update the url/logo to your production domain.
const siteUrl = "https://polyglotgpt.com"; // <-- replace with your real domain
const schemaOrgJSONLD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  url: siteUrl,
  name: "PolyglotGPT",
  description: "Conversational AI to Learn 50+ Languages",
  publisher: {
    "@type": "Organization",
    name: "PolyglotGPT",
    logo: {
      "@type": "ImageObject",
      url: `${siteUrl}/polyglotgpt_logo.png`,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <AppContextProvider>
        <html lang="en">
          <head>
            {/* Basic meta tags for improved SEO & social sharing */}
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1"
            />
            <meta name="description" content={metadata.description} />
            <meta name="keywords" content={metadata.keywords.join(", ")} />
            <link rel="icon" href="/favicon.ico" />
            <script
              type="application/ld+json"
              // dangerouslySetInnerHTML is not available in server components the same way;
              // we'll output JSON-LD by embedding it as a string inside a script tag.
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(schemaOrgJSONLD),
              }}
            />
          </head>
          <body
            className={`${inter.variable} ${geistMono.variable} antialiased`}
          >
            <Toaster
              toastOptions={{
                success: {
                  style: {
                    background: "black",
                    color: "white",
                  },
                },
                error: {
                  style: {
                    background: "black",
                    color: "white",
                  },
                },
              }}
            />
            {children}
          </body>
        </html>
      </AppContextProvider>
    </ClerkProvider>
  );
}
