import { InsertStatement } from "./statement";
import { OptionalMulti } from "./utilities";

export const mockInsert = <T>(
    result: OptionalMulti<T>
): jest.SpyInstance<Promise<T[]>> => {
    return jest
        .spyOn(InsertStatement.prototype, "exec")
        .mockImplementation(() =>
            Promise.resolve(Array.isArray(result) ? result : [result])
        );
};
