import { prepOptionalMulti } from '../src/utilities';

describe('function prepOptionalMulti', () => {
    it('should return an array when given a single value', () => {
        expect(prepOptionalMulti(1)).toEqual([1]);
    });

    it('should return an array when given an array with a single value', () => {
        expect(prepOptionalMulti([1])).toEqual([1]);
    });

    it('should return an array when given an array', () => {
        expect(prepOptionalMulti([1, 2])).toEqual([1, 2]);
    });
});
