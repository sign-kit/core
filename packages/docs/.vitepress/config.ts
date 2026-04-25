import { defineConfig } from 'vitepress';

export default defineConfig({
  title: '@sign-kit/core',
  description: 'Client-first Vue 3 toolkit for building PDF signing experiences in the browser',
  lang: 'en-US',

  head: [['link', { rel: 'icon', href: '/favicon.png' }]],

  themeConfig: {
    siteTitle: false,

    search: {
      provider: 'local',
    },
    logo: {
      src: '/logo-horizontal-dev.png',
      width: 100,
      alt: '@sign-kit/core Logo',
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
          { text: 'Form Builder', link: '/api/form-builder' },
          { text: 'Signer', link: '/api/signer' },
          { text: 'Schema & Types', link: '/api/schema' },
          {
            text: 'Styling',
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
      { text: 'Demo Walkthrough', link: '/demo-walkthrough' },
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
            { text: 'Form Builder', link: '/api/form-builder' },
            { text: 'Signer', link: '/api/signer' },
            { text: 'Schema & Types', link: '/api/schema' },
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
