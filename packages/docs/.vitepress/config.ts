import { defineConfig } from 'vitepress';

export default defineConfig({
  title: '@signkit/core',
  description: 'Client-first Vue 3 toolkit for building PDF signing experiences in the browser',
  lang: 'en-US',

  head: [['link', { rel: 'icon', type: 'image/png', href: '/favicon.png' }]],

  themeConfig: {
    siteTitle: false,

    search: {
      provider: 'local',
    },
    logo: {
      src: '/logo-horizontal-dev.png',
      height: 36,
      alt: '@signkit/core Logo',
    },

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Getting Started', link: '/getting-started' },
      {
        text: 'Usage',
        items: [
          { text: 'Vue Components', link: '/usage/vue-usage' },
          { text: 'Web Components', link: '/usage/web-components' },
        ],
      },
      {
        text: 'API Reference',
        items: [
          { text: 'API Overview', link: '/api/README' },
          { text: 'FormBuilder Props', link: '/api/interfaces/FormBuilderProps' },
          { text: 'Signer Props', link: '/api/interfaces/SignerProps' },
          { text: 'Template Type', link: '/api/interfaces/Template' },
          { text: 'Manifest Type', link: '/api/interfaces/Manifest' },
          { text: 'PdfSource Type', link: '/api/interfaces/PdfSource' },
          {
            text: 'Styling Guide',
            link: '/styling',
          },
        ],
      },
      {
        text: 'Integrity & Security',
        items: [
          { text: 'Overview', link: '/integrity/overview' },
          { text: 'Server Integration', link: '/integrity/server-integration' },
        ],
      },
      { text: 'Demo', link: '/demo-walkthrough' },
      { text: 'FAQ', link: '/faq' },
      { text: 'Contributing', link: '/contributing' },
    ],

    sidebar: {
      '/getting-started': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Overview', link: '/getting-started' },
            { text: 'Installation', link: '/installation' },
          ],
        },
      ],
      '/usage/': [
        {
          text: 'Usage Guides',
          items: [
            { text: 'Vue Components', link: '/usage/vue-usage' },
            { text: 'Web Components', link: '/usage/web-components' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'API Overview', link: '/api/README' },
            { text: 'Styling Guide', link: '/styling' },
          ],
        },
        {
          text: 'Component Props',
          items: [
            { text: 'FormBuilder Props', link: '/api/interfaces/FormBuilderProps' },
            { text: 'Signer Props', link: '/api/interfaces/SignerProps' },
            { text: 'Signer Identity', link: '/api/interfaces/SignerInfo' },
            { text: 'Expected Hashes', link: '/api/interfaces/ExpectedHashes' },
          ],
        },
        {
          text: 'Core Types',
          items: [
            { text: 'Template', link: '/api/interfaces/Template' },
            { text: 'Manifest', link: '/api/interfaces/Manifest' },
            { text: 'PdfSource', link: '/api/interfaces/PdfSource' },
            { text: 'PdfInfo', link: '/api/interfaces/PdfInfo' },
            { text: 'Field', link: '/api/type-aliases/Field' },
            { text: 'FieldType', link: '/api/type-aliases/FieldType' },
          ],
        },
        {
          text: 'Utilities',
          items: [
            { text: 'canonicalizeTemplate', link: '/api/functions/canonicalizeTemplate' },
            { text: 'computeSha256', link: '/api/functions/computeSha256' },
            { text: 'computeValuesHash', link: '/api/functions/computeValuesHash' },
            { text: 'computePdfHash', link: '/api/variables/computePdfHash' },
          ],
        },
      ],
      '/integrity/': [
        {
          text: 'Integrity & Security',
          items: [
            { text: 'Overview', link: '/integrity/overview' },
            { text: 'Server Integration', link: '/integrity/server-integration' },
          ],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/sign-kit/core' }],

    footer: {
      message: 'Released under the Apache License 2.0.',
      copyright: 'Copyright © 2024-present',
    },

    editLink: {
      pattern: 'https://github.com/sign-kit/core/edit/main/packages/docs/:path',
      text: 'Edit this page on GitHub',
    },
  },

  markdown: {
    lineNumbers: true,
  },
});
