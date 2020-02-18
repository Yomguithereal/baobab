/**
 * Testing Sample State
 * =====================
 *
 * Sample data used throughout the unit tests to hydrate the trees easily.
 */
export default {
  undefinedValue: undefined,
  primitive: 3,
  one: {
    subone: {
      hello: 'world'
    },
    subtwo: {
      colors: ['blue', 'yellow']
    }
  },
  two: {
    firstname: 'John',
    lastname: 'Dillinger'
  },
  pointer: 1,
  setLater: null,
  list: [[1, 2], [3, 4]],
  longList: [1, 2, 3, 4],
  items: [
    {id: 'one'},
    {id: 'two', user: {name: 'John', surname: 'Talbot'}},
    {id: 'three'}
  ],
  sameStructureItems: [
    {id: 'one', user: {name: 'Jane', surname: 'Talbot'}},
    {id: 'two', user: {name: 'John', surname: 'Talbot'}}
  ]
};
