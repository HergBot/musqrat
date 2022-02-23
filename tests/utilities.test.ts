import { getUpdates, Nullable, prepOptionalMulti } from "../src/utilities";

interface TestTableSchema {
    tableId: number;
    description: Nullable<string>;
    active: boolean;
}

interface AnotherTableSchema {
    anotherId: string;
    value: number;
}

describe("file utilities", () => {
    describe("function prepOptionalMulti", () => {
        it("should return an array when given a single value", () => {
            expect(prepOptionalMulti(1)).toEqual([1]);
        });

        it("should return an array when given an array with a single value", () => {
            expect(prepOptionalMulti([1])).toEqual([1]);
        });

        it("should return an array when given an array", () => {
            expect(prepOptionalMulti([1, 2])).toEqual([1, 2]);
        });
    });

    describe("function getUpdates", () => {
        it("should return null with no valid updates", () => {
            const result = getUpdates<TestTableSchema, "tableId">({});
            expect(result).toEqual(null);
        });

        it("should return the update for a single field", () => {
            const result = getUpdates<TestTableSchema, "tableId">({
                description: "hello",
            });
            expect(result).toEqual([{ field: "description", value: "hello" }]);
        });

        it("should return the update for a single field", () => {
            const result = getUpdates<TestTableSchema, "tableId">({
                description: "hello",
                active: false,
            });
            expect(result).toEqual([
                { field: "description", value: "hello" },
                { field: "active", value: false },
            ]);
        });

        it("should allow you to update all fields when no primary key is given", () => {
            const result = getUpdates<AnotherTableSchema>({
                anotherId: "hello",
                value: 1,
            });
            expect(result).toEqual([
                { field: "anotherId", value: "hello" },
                { field: "value", value: 1 },
            ]);
        });
    });
});
