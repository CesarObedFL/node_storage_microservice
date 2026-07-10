export default {
    transform: {
        '^.+\\.js$': 'babel-jest', // Usa Babel para transformar archivos JS
    },
    extensionsToTreatAsEsm: ['.js'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    testEnvironment: 'node',
    transformIgnorePatterns: [
        'node_modules/(?!(supertest)/)',
    ],
};