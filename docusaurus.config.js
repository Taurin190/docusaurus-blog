const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
    title: 'Koichi Taura\'s Page',
    tagline: 'Software Engineer',
    url: 'https://taurin190.com',
    baseUrl: '/',
    onBrokenLinks: 'throw',
    onBrokenMarkdownLinks: 'warn',
    favicon: 'img/favicon.ico',
    organizationName: 'taurin190', // Usually your GitHub org/user name.
    projectName: 'docusaurus-blog', // Usually your repo name.
    themeConfig: {
        colorMode: {
            disableSwitch: true,
        },
        navbar: {
            title: 'Lighting up a Conrner',
            style: 'dark',
            items: [
                { to: '/profile', label: 'Profile', position: 'right' },
                { to: '/blog', label: 'Blog', position: 'right' },
                {
                    href: 'https://github.com/taurin190',
                    label: 'GitHub',
                    position: 'right',
                },
            ],
        },
        footer: {
            style: 'dark',
            copyright: `Copyright © ${new Date().getFullYear()} Taurin190. `,
        },
        prism: {
            theme: lightCodeTheme,
            darkTheme: darkCodeTheme,
        },
    },
    presets: [
        [
            '@docusaurus/preset-classic',
            {
                docs: {
                    sidebarPath: require.resolve('./sidebars.js'),
                    // Please change this to your repo.
                    editUrl: 'https://github.com/facebook/docusaurus/edit/master/website/',
                },
                blog: {
                    showReadingTime: true,
                    // Please change this to your repo.
                    editUrl: 'https://github.com/facebook/docusaurus/edit/master/website/blog/',
                },
                theme: {
                    customCss: require.resolve('./src/css/custom.css'),
                },
            },
        ],
    ],
};