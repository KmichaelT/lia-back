export default {
  routes: [
    {
      method: 'GET',
      path: '/academic-results/my-child/:childRef',
      handler: 'academic-result.myChildResults',
      config: {
        auth: {
          scope: [],
        },
        policies: [],
        description: 'Get matched academic results for a child sponsored by the authenticated user',
        tags: ['Academic Result', 'Sponsor'],
      },
    },
    {
      method: 'POST',
      path: '/academic-results/import',
      handler: 'academic-result.importWorkbook',
      config: {
        auth: {
          scope: ['api::academic-result.academic-result.create'],
        },
        policies: [],
        description: 'Validate and import academic results from an Excel workbook',
        tags: ['Academic Result'],
      },
    },
  ],
};
