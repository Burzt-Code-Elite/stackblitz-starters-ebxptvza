import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css" />
        <style>{`
          @media (min-width: 751px) {
            .centered-container {
              margin-left: 30%;
              margin-right: 30%;
            }
          }
          
          .centered-container {
            margin-top: 5rem;
          }
        `}</style>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}