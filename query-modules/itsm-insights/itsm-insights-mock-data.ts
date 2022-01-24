export const MOCK_JSON_NUMBER_OF_EXECUTIONS = {
  data: [{ num_exectn: 20 }],
};

export const MOCK_JSON_NUMBER_OF_JOBS_CREATED = {
  data: [{ num_jobs: 10 }],
};

export const MOCK_JSON_TOP_EMERGING_CLUSTERS = [
  {
    columns: [
      {
        text: 'Clusters',
        type: 'string',
      },
      {
        text: 'Incidents',
        type: 'number',
      },
    ],
    rows: [
      ['smartreporting-pod-node', 34],
      ['smartit-ind-slave', 14],
      ['raise-broker-unable', 33],
      ['arl-storage-filesystem', 14],
      ['deployment-tomcat-est', 33],
    ],
    type: 'table',
  },
];

/* [
  {
    columns: [
      {
        text: 'smartreporting-pod-node',
        type: 'number',
      },
      {
        text: 'smartit-ind-slave',
        type: 'number',
      },
      {
        text: 'raise-broker-unable',
        type: 'number',
      },
      {
        text: 'arl-storage-filesystem',
        type: 'number',
      },
      {
        text: 'deployment-tomcat-est',
        type: 'number',
      },
    ],
    rows: [[23, 34, 45, 14, 32]],
    type: 'table',
  },
]; */
