/* eslint-disable */
export default {
  displayName: 'shopping-cart-lambda-stream-to-sns',
  preset: '../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../coverage/shopping-cart-lambda-stream-to-sns',
}
