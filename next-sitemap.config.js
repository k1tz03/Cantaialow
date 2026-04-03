/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://conductoros.com',
  generateRobotsTxt: true,
  exclude: ['/admin/*', '/api/*', '/dashboard/*', '/settings/*', '/emails/*', '/affaires/*', '/contrats/*', '/documents/*', '/fournisseurs/*', '/planning/*', '/assistant/*', '/guide/*'],
  robotsTxtOptions: {
    additionalSitemaps: [],
    policies: [
      { userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/dashboard', '/settings'] },
    ],
  },
};
