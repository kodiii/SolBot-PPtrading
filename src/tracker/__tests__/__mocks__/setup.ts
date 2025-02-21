// Mock config before any other imports
jest.mock('../../../config', () => ({
  config: {
    swap: {
      db_name_tracker_holdings: ':memory:'
    }
  }
}));

// Mock sqlite
jest.mock('sqlite', () => {
  const actual = jest.requireActual('sqlite');
  return {
    ...actual,
    open: jest.fn()
  };
});
