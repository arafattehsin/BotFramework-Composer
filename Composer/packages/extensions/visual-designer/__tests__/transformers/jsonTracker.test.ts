import { insert, deleteNode, queryNode } from '../../src/utils/jsonTracker';

describe('queryNode', () => {
  describe('can query correct result', () => {
    const dialog = { foo: { bar: [{ $type: 'firstOne' }, { $type: 'secondOne' }] } };
    it('when data not exists.', () => {
      expect(queryNode({}, 'foo.bar[0]')).toEqual(null);
    });

    it('when data locates in an object.', () => {
      expect(queryNode(dialog, 'foo.bar')).toEqual([{ $type: 'firstOne' }, { $type: 'secondOne' }]);
    });

    it('when data locates in an array.', () => {
      expect(queryNode(dialog, 'foo.bar[0]')).toEqual({ $type: 'firstOne' });
    });
  });

  it('should return a reference.', () => {
    const dialog = { foo: { bar: 'bar' } };
    const result = queryNode(dialog, 'foo');
    expect(result).toBe(dialog.foo);

    dialog.foo.bar = 'newValue';
    expect(dialog.foo).toEqual({ bar: 'newValue' });
    expect(result).toEqual({ bar: 'newValue' });
  });
});

describe('insert', () => {
  const path = 'foo.bar';
  let dialog;

  beforeEach(() => {
    dialog = { foo: {} };
  });

  describe('when data already exists', () => {
    beforeEach(() => {
      dialog.foo.bar = [{ $type: 'firstOne' }, { $type: 'secondOne' }];
    });

    it('inserts into the correct position', () => {
      const updated = insert(dialog, path, 1, 'newOne');
      expect(updated.foo.bar).toEqual([
        {
          $type: 'firstOne',
        },
        {
          $type: 'newOne',
          $designer: { id: expect.any(String) },
        },
        {
          $type: 'secondOne',
        },
      ]);
    });

    it('inserts into front if position is less than 0', () => {
      const updated = insert(dialog, path, -2, 'newOne');
      expect(updated.foo.bar).toEqual([
        {
          $type: 'newOne',
          $designer: { id: expect.any(String) },
        },
        {
          $type: 'firstOne',
        },
        {
          $type: 'secondOne',
        },
      ]);
    });

    it('inserts into end if position is greater than length', () => {
      const updated = insert(dialog, path, 10, 'newOne');
      expect(updated.foo.bar).toEqual([
        {
          $type: 'firstOne',
        },
        {
          $type: 'secondOne',
        },
        {
          $type: 'newOne',
          $designer: { id: expect.any(String) },
        },
      ]);
    });

    it('inserts at end if position is undefined', () => {
      const updated = insert(dialog, path, undefined, 'newOne');
      expect(updated.foo.bar).toEqual([
        {
          $type: 'firstOne',
        },
        {
          $type: 'secondOne',
        },
        {
          $type: 'newOne',
          $designer: { id: expect.any(String) },
        },
      ]);
    });
  });

  describe('when data does not exist', () => {
    it('inserts a new array with one element', () => {
      const path = 'foo.bar';

      const updated = insert(dialog, path, 0, 'newOne');

      expect(updated.foo.bar).toEqual([{ $type: 'newOne', $designer: { id: expect.any(String) } }]);
    });
  });
});

describe('delete node flow', () => {
  let dialog, path, removedDataFn;
  beforeEach(() => {
    dialog = { foo: { bar: [{ $type: 'firstOne' }, { $type: 'secondOne' }] } };
    removedDataFn = jest.fn();
  });

  describe('when target node does not exist', () => {
    it('should not change the data', () => {
      path = null;
      const result = deleteNode(dialog, path, removedDataFn);

      expect(result).toEqual(dialog);
      expect(removedDataFn).not.toBeCalled();
    });
  });

  describe('when target node exists', () => {
    it("should delete node successfully when targetNode's currentKey type is number", () => {
      path = 'foo.bar[0]';
      const result = deleteNode(dialog, path, removedDataFn);

      expect(result).toEqual({ foo: { bar: [{ $type: 'secondOne' }] } });
      expect(removedDataFn).toBeCalledWith(dialog.foo.bar[0]);
    });
    it("should delete node successfully when targetNode's currentKey type is string", () => {
      path = 'foo.bar';
      const result = deleteNode(dialog, path, removedDataFn);

      expect(result).toEqual({ foo: {} });
      expect(removedDataFn).toBeCalledWith(dialog.foo.bar);
    });
    it("removeLgTemplate function should be called when targetNode's $type is 'Microsoft.SendActivity' && activity includes '[bfdactivity-'", () => {
      dialog.foo.activityNode = { $type: 'Microsoft.SendActivity', activity: '[bfdactivity-a]' };
      path = 'foo.activityNode';
      const result = deleteNode(dialog, path, removedDataFn);

      expect(removedDataFn).toBeCalledWith(dialog.foo.activityNode);
      expect(result).toEqual({ foo: { bar: [{ $type: 'firstOne' }, { $type: 'secondOne' }] } });
    });
  });
});
