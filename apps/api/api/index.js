var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/app.ts
import { Hono as Hono8 } from "hono";
import { cors } from "hono/cors";

// ../../node_modules/drizzle-orm/entity.js
var entityKind = /* @__PURE__ */ Symbol.for("drizzle:entityKind");
function is(value, type) {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (value instanceof type) {
    return true;
  }
  if (!Object.prototype.hasOwnProperty.call(type, entityKind)) {
    throw new Error(
      `Class "${type.name ?? "<unknown>"}" doesn't look like a Drizzle entity. If this is incorrect and the class is provided by Drizzle, please report this as a bug.`
    );
  }
  let cls = Object.getPrototypeOf(value).constructor;
  if (cls) {
    while (cls) {
      if (entityKind in cls && cls[entityKind] === type[entityKind]) {
        return true;
      }
      cls = Object.getPrototypeOf(cls);
    }
  }
  return false;
}

// ../../node_modules/drizzle-orm/column.js
var Column = class {
  constructor(table, config) {
    this.table = table;
    this.config = config;
    this.name = config.name;
    this.keyAsName = config.keyAsName;
    this.notNull = config.notNull;
    this.default = config.default;
    this.defaultFn = config.defaultFn;
    this.onUpdateFn = config.onUpdateFn;
    this.hasDefault = config.hasDefault;
    this.primary = config.primaryKey;
    this.isUnique = config.isUnique;
    this.uniqueName = config.uniqueName;
    this.uniqueType = config.uniqueType;
    this.dataType = config.dataType;
    this.columnType = config.columnType;
    this.generated = config.generated;
    this.generatedIdentity = config.generatedIdentity;
  }
  static [entityKind] = "Column";
  name;
  keyAsName;
  primary;
  notNull;
  default;
  defaultFn;
  onUpdateFn;
  hasDefault;
  isUnique;
  uniqueName;
  uniqueType;
  dataType;
  columnType;
  enumValues = void 0;
  generated = void 0;
  generatedIdentity = void 0;
  config;
  mapFromDriverValue(value) {
    return value;
  }
  mapToDriverValue(value) {
    return value;
  }
  // ** @internal */
  shouldDisableInsert() {
    return this.config.generated !== void 0 && this.config.generated.type !== "byDefault";
  }
};

// ../../node_modules/drizzle-orm/column-builder.js
var ColumnBuilder = class {
  static [entityKind] = "ColumnBuilder";
  config;
  constructor(name, dataType, columnType) {
    this.config = {
      name,
      keyAsName: name === "",
      notNull: false,
      default: void 0,
      hasDefault: false,
      primaryKey: false,
      isUnique: false,
      uniqueName: void 0,
      uniqueType: void 0,
      dataType,
      columnType,
      generated: void 0
    };
  }
  /**
   * Changes the data type of the column. Commonly used with `json` columns. Also, useful for branded types.
   *
   * @example
   * ```ts
   * const users = pgTable('users', {
   * 	id: integer('id').$type<UserId>().primaryKey(),
   * 	details: json('details').$type<UserDetails>().notNull(),
   * });
   * ```
   */
  $type() {
    return this;
  }
  /**
   * Adds a `not null` clause to the column definition.
   *
   * Affects the `select` model of the table - columns *without* `not null` will be nullable on select.
   */
  notNull() {
    this.config.notNull = true;
    return this;
  }
  /**
   * Adds a `default <value>` clause to the column definition.
   *
   * Affects the `insert` model of the table - columns *with* `default` are optional on insert.
   *
   * If you need to set a dynamic default value, use {@link $defaultFn} instead.
   */
  default(value) {
    this.config.default = value;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Adds a dynamic default value to the column.
   * The function will be called when the row is inserted, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $defaultFn(fn) {
    this.config.defaultFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Alias for {@link $defaultFn}.
   */
  $default = this.$defaultFn;
  /**
   * Adds a dynamic update value to the column.
   * The function will be called when the row is updated, and the returned value will be used as the column value if none is provided.
   * If no `default` (or `$defaultFn`) value is provided, the function will be called when the row is inserted as well, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $onUpdateFn(fn) {
    this.config.onUpdateFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Alias for {@link $onUpdateFn}.
   */
  $onUpdate = this.$onUpdateFn;
  /**
   * Adds a `primary key` clause to the column definition. This implicitly makes the column `not null`.
   *
   * In SQLite, `integer primary key` implicitly makes the column auto-incrementing.
   */
  primaryKey() {
    this.config.primaryKey = true;
    this.config.notNull = true;
    return this;
  }
  /** @internal Sets the name of the column to the key within the table definition if a name was not given. */
  setName(name) {
    if (this.config.name !== "") return;
    this.config.name = name;
  }
};

// ../../node_modules/drizzle-orm/table.utils.js
var TableName = /* @__PURE__ */ Symbol.for("drizzle:Name");

// ../../node_modules/drizzle-orm/pg-core/foreign-keys.js
var ForeignKeyBuilder = class {
  static [entityKind] = "PgForeignKeyBuilder";
  /** @internal */
  reference;
  /** @internal */
  _onUpdate = "no action";
  /** @internal */
  _onDelete = "no action";
  constructor(config, actions) {
    this.reference = () => {
      const { name, columns, foreignColumns } = config();
      return { name, columns, foreignTable: foreignColumns[0].table, foreignColumns };
    };
    if (actions) {
      this._onUpdate = actions.onUpdate;
      this._onDelete = actions.onDelete;
    }
  }
  onUpdate(action) {
    this._onUpdate = action === void 0 ? "no action" : action;
    return this;
  }
  onDelete(action) {
    this._onDelete = action === void 0 ? "no action" : action;
    return this;
  }
  /** @internal */
  build(table) {
    return new ForeignKey(table, this);
  }
};
var ForeignKey = class {
  constructor(table, builder) {
    this.table = table;
    this.reference = builder.reference;
    this.onUpdate = builder._onUpdate;
    this.onDelete = builder._onDelete;
  }
  static [entityKind] = "PgForeignKey";
  reference;
  onUpdate;
  onDelete;
  getName() {
    const { name, columns, foreignColumns } = this.reference();
    const columnNames = columns.map((column) => column.name);
    const foreignColumnNames = foreignColumns.map((column) => column.name);
    const chunks = [
      this.table[TableName],
      ...columnNames,
      foreignColumns[0].table[TableName],
      ...foreignColumnNames
    ];
    return name ?? `${chunks.join("_")}_fk`;
  }
};

// ../../node_modules/drizzle-orm/tracing-utils.js
function iife(fn, ...args) {
  return fn(...args);
}

// ../../node_modules/drizzle-orm/pg-core/unique-constraint.js
function uniqueKeyName(table, columns) {
  return `${table[TableName]}_${columns.join("_")}_unique`;
}
var UniqueConstraintBuilder = class {
  constructor(columns, name) {
    this.name = name;
    this.columns = columns;
  }
  static [entityKind] = "PgUniqueConstraintBuilder";
  /** @internal */
  columns;
  /** @internal */
  nullsNotDistinctConfig = false;
  nullsNotDistinct() {
    this.nullsNotDistinctConfig = true;
    return this;
  }
  /** @internal */
  build(table) {
    return new UniqueConstraint(table, this.columns, this.nullsNotDistinctConfig, this.name);
  }
};
var UniqueOnConstraintBuilder = class {
  static [entityKind] = "PgUniqueOnConstraintBuilder";
  /** @internal */
  name;
  constructor(name) {
    this.name = name;
  }
  on(...columns) {
    return new UniqueConstraintBuilder(columns, this.name);
  }
};
var UniqueConstraint = class {
  constructor(table, columns, nullsNotDistinct, name) {
    this.table = table;
    this.columns = columns;
    this.name = name ?? uniqueKeyName(this.table, this.columns.map((column) => column.name));
    this.nullsNotDistinct = nullsNotDistinct;
  }
  static [entityKind] = "PgUniqueConstraint";
  columns;
  name;
  nullsNotDistinct = false;
  getName() {
    return this.name;
  }
};

// ../../node_modules/drizzle-orm/pg-core/utils/array.js
function parsePgArrayValue(arrayString, startFrom, inQuotes) {
  for (let i = startFrom; i < arrayString.length; i++) {
    const char = arrayString[i];
    if (char === "\\") {
      i++;
      continue;
    }
    if (char === '"') {
      return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i + 1];
    }
    if (inQuotes) {
      continue;
    }
    if (char === "," || char === "}") {
      return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i];
    }
  }
  return [arrayString.slice(startFrom).replace(/\\/g, ""), arrayString.length];
}
function parsePgNestedArray(arrayString, startFrom = 0) {
  const result = [];
  let i = startFrom;
  let lastCharIsComma = false;
  while (i < arrayString.length) {
    const char = arrayString[i];
    if (char === ",") {
      if (lastCharIsComma || i === startFrom) {
        result.push("");
      }
      lastCharIsComma = true;
      i++;
      continue;
    }
    lastCharIsComma = false;
    if (char === "\\") {
      i += 2;
      continue;
    }
    if (char === '"') {
      const [value2, startFrom2] = parsePgArrayValue(arrayString, i + 1, true);
      result.push(value2);
      i = startFrom2;
      continue;
    }
    if (char === "}") {
      return [result, i + 1];
    }
    if (char === "{") {
      const [value2, startFrom2] = parsePgNestedArray(arrayString, i + 1);
      result.push(value2);
      i = startFrom2;
      continue;
    }
    const [value, newStartFrom] = parsePgArrayValue(arrayString, i, false);
    result.push(value);
    i = newStartFrom;
  }
  return [result, i];
}
function parsePgArray(arrayString) {
  const [result] = parsePgNestedArray(arrayString, 1);
  return result;
}
function makePgArray(array) {
  return `{${array.map((item) => {
    if (Array.isArray(item)) {
      return makePgArray(item);
    }
    if (typeof item === "string") {
      return `"${item.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    }
    return `${item}`;
  }).join(",")}}`;
}

// ../../node_modules/drizzle-orm/pg-core/columns/common.js
var PgColumnBuilder = class extends ColumnBuilder {
  foreignKeyConfigs = [];
  static [entityKind] = "PgColumnBuilder";
  array(size) {
    return new PgArrayBuilder(this.config.name, this, size);
  }
  references(ref, actions = {}) {
    this.foreignKeyConfigs.push({ ref, actions });
    return this;
  }
  unique(name, config) {
    this.config.isUnique = true;
    this.config.uniqueName = name;
    this.config.uniqueType = config?.nulls;
    return this;
  }
  generatedAlwaysAs(as) {
    this.config.generated = {
      as,
      type: "always",
      mode: "stored"
    };
    return this;
  }
  /** @internal */
  buildForeignKeys(column, table) {
    return this.foreignKeyConfigs.map(({ ref, actions }) => {
      return iife(
        (ref2, actions2) => {
          const builder = new ForeignKeyBuilder(() => {
            const foreignColumn = ref2();
            return { columns: [column], foreignColumns: [foreignColumn] };
          });
          if (actions2.onUpdate) {
            builder.onUpdate(actions2.onUpdate);
          }
          if (actions2.onDelete) {
            builder.onDelete(actions2.onDelete);
          }
          return builder.build(table);
        },
        ref,
        actions
      );
    });
  }
  /** @internal */
  buildExtraConfigColumn(table) {
    return new ExtraConfigColumn(table, this.config);
  }
};
var PgColumn = class extends Column {
  constructor(table, config) {
    if (!config.uniqueName) {
      config.uniqueName = uniqueKeyName(table, [config.name]);
    }
    super(table, config);
    this.table = table;
  }
  static [entityKind] = "PgColumn";
};
var ExtraConfigColumn = class extends PgColumn {
  static [entityKind] = "ExtraConfigColumn";
  getSQLType() {
    return this.getSQLType();
  }
  indexConfig = {
    order: this.config.order ?? "asc",
    nulls: this.config.nulls ?? "last",
    opClass: this.config.opClass
  };
  defaultConfig = {
    order: "asc",
    nulls: "last",
    opClass: void 0
  };
  asc() {
    this.indexConfig.order = "asc";
    return this;
  }
  desc() {
    this.indexConfig.order = "desc";
    return this;
  }
  nullsFirst() {
    this.indexConfig.nulls = "first";
    return this;
  }
  nullsLast() {
    this.indexConfig.nulls = "last";
    return this;
  }
  /**
   * ### PostgreSQL documentation quote
   *
   * > An operator class with optional parameters can be specified for each column of an index.
   * The operator class identifies the operators to be used by the index for that column.
   * For example, a B-tree index on four-byte integers would use the int4_ops class;
   * this operator class includes comparison functions for four-byte integers.
   * In practice the default operator class for the column's data type is usually sufficient.
   * The main point of having operator classes is that for some data types, there could be more than one meaningful ordering.
   * For example, we might want to sort a complex-number data type either by absolute value or by real part.
   * We could do this by defining two operator classes for the data type and then selecting the proper class when creating an index.
   * More information about operator classes check:
   *
   * ### Useful links
   * https://www.postgresql.org/docs/current/sql-createindex.html
   *
   * https://www.postgresql.org/docs/current/indexes-opclass.html
   *
   * https://www.postgresql.org/docs/current/xindex.html
   *
   * ### Additional types
   * If you have the `pg_vector` extension installed in your database, you can use the
   * `vector_l2_ops`, `vector_ip_ops`, `vector_cosine_ops`, `vector_l1_ops`, `bit_hamming_ops`, `bit_jaccard_ops`, `halfvec_l2_ops`, `sparsevec_l2_ops` options, which are predefined types.
   *
   * **You can always specify any string you want in the operator class, in case Drizzle doesn't have it natively in its types**
   *
   * @param opClass
   * @returns
   */
  op(opClass) {
    this.indexConfig.opClass = opClass;
    return this;
  }
};
var IndexedColumn = class {
  static [entityKind] = "IndexedColumn";
  constructor(name, keyAsName, type, indexConfig) {
    this.name = name;
    this.keyAsName = keyAsName;
    this.type = type;
    this.indexConfig = indexConfig;
  }
  name;
  keyAsName;
  type;
  indexConfig;
};
var PgArrayBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgArrayBuilder";
  constructor(name, baseBuilder, size) {
    super(name, "array", "PgArray");
    this.config.baseBuilder = baseBuilder;
    this.config.size = size;
  }
  /** @internal */
  build(table) {
    const baseColumn = this.config.baseBuilder.build(table);
    return new PgArray(
      table,
      this.config,
      baseColumn
    );
  }
};
var PgArray = class _PgArray extends PgColumn {
  constructor(table, config, baseColumn, range) {
    super(table, config);
    this.baseColumn = baseColumn;
    this.range = range;
    this.size = config.size;
  }
  size;
  static [entityKind] = "PgArray";
  getSQLType() {
    return `${this.baseColumn.getSQLType()}[${typeof this.size === "number" ? this.size : ""}]`;
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      value = parsePgArray(value);
    }
    return value.map((v) => this.baseColumn.mapFromDriverValue(v));
  }
  mapToDriverValue(value, isNestedArray = false) {
    const a = value.map(
      (v) => v === null ? null : is(this.baseColumn, _PgArray) ? this.baseColumn.mapToDriverValue(v, true) : this.baseColumn.mapToDriverValue(v)
    );
    if (isNestedArray) return a;
    return makePgArray(a);
  }
};

// ../../node_modules/drizzle-orm/pg-core/columns/enum.js
var PgEnumObjectColumnBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgEnumObjectColumnBuilder";
  constructor(name, enumInstance) {
    super(name, "string", "PgEnumObjectColumn");
    this.config.enum = enumInstance;
  }
  /** @internal */
  build(table) {
    return new PgEnumObjectColumn(
      table,
      this.config
    );
  }
};
var PgEnumObjectColumn = class extends PgColumn {
  static [entityKind] = "PgEnumObjectColumn";
  enum;
  enumValues = this.config.enum.enumValues;
  constructor(table, config) {
    super(table, config);
    this.enum = config.enum;
  }
  getSQLType() {
    return this.enum.enumName;
  }
};
var isPgEnumSym = /* @__PURE__ */ Symbol.for("drizzle:isPgEnum");
function isPgEnum(obj) {
  return !!obj && typeof obj === "function" && isPgEnumSym in obj && obj[isPgEnumSym] === true;
}
var PgEnumColumnBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgEnumColumnBuilder";
  constructor(name, enumInstance) {
    super(name, "string", "PgEnumColumn");
    this.config.enum = enumInstance;
  }
  /** @internal */
  build(table) {
    return new PgEnumColumn(
      table,
      this.config
    );
  }
};
var PgEnumColumn = class extends PgColumn {
  static [entityKind] = "PgEnumColumn";
  enum = this.config.enum;
  enumValues = this.config.enum.enumValues;
  constructor(table, config) {
    super(table, config);
    this.enum = config.enum;
  }
  getSQLType() {
    return this.enum.enumName;
  }
};

// ../../node_modules/drizzle-orm/subquery.js
var Subquery = class {
  static [entityKind] = "Subquery";
  constructor(sql2, fields, alias, isWith = false, usedTables = []) {
    this._ = {
      brand: "Subquery",
      sql: sql2,
      selectedFields: fields,
      alias,
      isWith,
      usedTables
    };
  }
  // getSQL(): SQL<unknown> {
  // 	return new SQL([this]);
  // }
};
var WithSubquery = class extends Subquery {
  static [entityKind] = "WithSubquery";
};

// ../../node_modules/drizzle-orm/version.js
var version = "0.45.2";

// ../../node_modules/drizzle-orm/tracing.js
var otel;
var rawTracer;
var tracer = {
  startActiveSpan(name, fn) {
    if (!otel) {
      return fn();
    }
    if (!rawTracer) {
      rawTracer = otel.trace.getTracer("drizzle-orm", version);
    }
    return iife(
      (otel2, rawTracer2) => rawTracer2.startActiveSpan(
        name,
        (span) => {
          try {
            return fn(span);
          } catch (e) {
            span.setStatus({
              code: otel2.SpanStatusCode.ERROR,
              message: e instanceof Error ? e.message : "Unknown error"
              // eslint-disable-line no-instanceof/no-instanceof
            });
            throw e;
          } finally {
            span.end();
          }
        }
      ),
      otel,
      rawTracer
    );
  }
};

// ../../node_modules/drizzle-orm/view-common.js
var ViewBaseConfig = /* @__PURE__ */ Symbol.for("drizzle:ViewBaseConfig");

// ../../node_modules/drizzle-orm/table.js
var Schema = /* @__PURE__ */ Symbol.for("drizzle:Schema");
var Columns = /* @__PURE__ */ Symbol.for("drizzle:Columns");
var ExtraConfigColumns = /* @__PURE__ */ Symbol.for("drizzle:ExtraConfigColumns");
var OriginalName = /* @__PURE__ */ Symbol.for("drizzle:OriginalName");
var BaseName = /* @__PURE__ */ Symbol.for("drizzle:BaseName");
var IsAlias = /* @__PURE__ */ Symbol.for("drizzle:IsAlias");
var ExtraConfigBuilder = /* @__PURE__ */ Symbol.for("drizzle:ExtraConfigBuilder");
var IsDrizzleTable = /* @__PURE__ */ Symbol.for("drizzle:IsDrizzleTable");
var Table = class {
  static [entityKind] = "Table";
  /** @internal */
  static Symbol = {
    Name: TableName,
    Schema,
    OriginalName,
    Columns,
    ExtraConfigColumns,
    BaseName,
    IsAlias,
    ExtraConfigBuilder
  };
  /**
   * @internal
   * Can be changed if the table is aliased.
   */
  [TableName];
  /**
   * @internal
   * Used to store the original name of the table, before any aliasing.
   */
  [OriginalName];
  /** @internal */
  [Schema];
  /** @internal */
  [Columns];
  /** @internal */
  [ExtraConfigColumns];
  /**
   *  @internal
   * Used to store the table name before the transformation via the `tableCreator` functions.
   */
  [BaseName];
  /** @internal */
  [IsAlias] = false;
  /** @internal */
  [IsDrizzleTable] = true;
  /** @internal */
  [ExtraConfigBuilder] = void 0;
  constructor(name, schema, baseName) {
    this[TableName] = this[OriginalName] = name;
    this[Schema] = schema;
    this[BaseName] = baseName;
  }
};
function getTableName(table) {
  return table[TableName];
}
function getTableUniqueName(table) {
  return `${table[Schema] ?? "public"}.${table[TableName]}`;
}

// ../../node_modules/drizzle-orm/sql/sql.js
var FakePrimitiveParam = class {
  static [entityKind] = "FakePrimitiveParam";
};
function isSQLWrapper(value) {
  return value !== null && value !== void 0 && typeof value.getSQL === "function";
}
function mergeQueries(queries) {
  const result = { sql: "", params: [] };
  for (const query of queries) {
    result.sql += query.sql;
    result.params.push(...query.params);
    if (query.typings?.length) {
      if (!result.typings) {
        result.typings = [];
      }
      result.typings.push(...query.typings);
    }
  }
  return result;
}
var StringChunk = class {
  static [entityKind] = "StringChunk";
  value;
  constructor(value) {
    this.value = Array.isArray(value) ? value : [value];
  }
  getSQL() {
    return new SQL([this]);
  }
};
var SQL = class _SQL {
  constructor(queryChunks) {
    this.queryChunks = queryChunks;
    for (const chunk of queryChunks) {
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        this.usedTables.push(
          schemaName === void 0 ? chunk[Table.Symbol.Name] : schemaName + "." + chunk[Table.Symbol.Name]
        );
      }
    }
  }
  static [entityKind] = "SQL";
  /** @internal */
  decoder = noopDecoder;
  shouldInlineParams = false;
  /** @internal */
  usedTables = [];
  append(query) {
    this.queryChunks.push(...query.queryChunks);
    return this;
  }
  toQuery(config) {
    return tracer.startActiveSpan("drizzle.buildSQL", (span) => {
      const query = this.buildQueryFromSourceParams(this.queryChunks, config);
      span?.setAttributes({
        "drizzle.query.text": query.sql,
        "drizzle.query.params": JSON.stringify(query.params)
      });
      return query;
    });
  }
  buildQueryFromSourceParams(chunks, _config) {
    const config = Object.assign({}, _config, {
      inlineParams: _config.inlineParams || this.shouldInlineParams,
      paramStartIndex: _config.paramStartIndex || { value: 0 }
    });
    const {
      casing,
      escapeName,
      escapeParam,
      prepareTyping,
      inlineParams,
      paramStartIndex
    } = config;
    return mergeQueries(chunks.map((chunk) => {
      if (is(chunk, StringChunk)) {
        return { sql: chunk.value.join(""), params: [] };
      }
      if (is(chunk, Name)) {
        return { sql: escapeName(chunk.value), params: [] };
      }
      if (chunk === void 0) {
        return { sql: "", params: [] };
      }
      if (Array.isArray(chunk)) {
        const result = [new StringChunk("(")];
        for (const [i, p] of chunk.entries()) {
          result.push(p);
          if (i < chunk.length - 1) {
            result.push(new StringChunk(", "));
          }
        }
        result.push(new StringChunk(")"));
        return this.buildQueryFromSourceParams(result, config);
      }
      if (is(chunk, _SQL)) {
        return this.buildQueryFromSourceParams(chunk.queryChunks, {
          ...config,
          inlineParams: inlineParams || chunk.shouldInlineParams
        });
      }
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        const tableName = chunk[Table.Symbol.Name];
        return {
          sql: schemaName === void 0 || chunk[IsAlias] ? escapeName(tableName) : escapeName(schemaName) + "." + escapeName(tableName),
          params: []
        };
      }
      if (is(chunk, Column)) {
        const columnName = casing.getColumnCasing(chunk);
        if (_config.invokeSource === "indexes") {
          return { sql: escapeName(columnName), params: [] };
        }
        const schemaName = chunk.table[Table.Symbol.Schema];
        return {
          sql: chunk.table[IsAlias] || schemaName === void 0 ? escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName) : escapeName(schemaName) + "." + escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName),
          params: []
        };
      }
      if (is(chunk, View)) {
        const schemaName = chunk[ViewBaseConfig].schema;
        const viewName = chunk[ViewBaseConfig].name;
        return {
          sql: schemaName === void 0 || chunk[ViewBaseConfig].isAlias ? escapeName(viewName) : escapeName(schemaName) + "." + escapeName(viewName),
          params: []
        };
      }
      if (is(chunk, Param)) {
        if (is(chunk.value, Placeholder)) {
          return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
        }
        const mappedValue = chunk.value === null ? null : chunk.encoder.mapToDriverValue(chunk.value);
        if (is(mappedValue, _SQL)) {
          return this.buildQueryFromSourceParams([mappedValue], config);
        }
        if (inlineParams) {
          return { sql: this.mapInlineParam(mappedValue, config), params: [] };
        }
        let typings = ["none"];
        if (prepareTyping) {
          typings = [prepareTyping(chunk.encoder)];
        }
        return { sql: escapeParam(paramStartIndex.value++, mappedValue), params: [mappedValue], typings };
      }
      if (is(chunk, Placeholder)) {
        return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
      }
      if (is(chunk, _SQL.Aliased) && chunk.fieldAlias !== void 0) {
        return { sql: escapeName(chunk.fieldAlias), params: [] };
      }
      if (is(chunk, Subquery)) {
        if (chunk._.isWith) {
          return { sql: escapeName(chunk._.alias), params: [] };
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk._.sql,
          new StringChunk(") "),
          new Name(chunk._.alias)
        ], config);
      }
      if (isPgEnum(chunk)) {
        if (chunk.schema) {
          return { sql: escapeName(chunk.schema) + "." + escapeName(chunk.enumName), params: [] };
        }
        return { sql: escapeName(chunk.enumName), params: [] };
      }
      if (isSQLWrapper(chunk)) {
        if (chunk.shouldOmitSQLParens?.()) {
          return this.buildQueryFromSourceParams([chunk.getSQL()], config);
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk.getSQL(),
          new StringChunk(")")
        ], config);
      }
      if (inlineParams) {
        return { sql: this.mapInlineParam(chunk, config), params: [] };
      }
      return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
    }));
  }
  mapInlineParam(chunk, { escapeString }) {
    if (chunk === null) {
      return "null";
    }
    if (typeof chunk === "number" || typeof chunk === "boolean") {
      return chunk.toString();
    }
    if (typeof chunk === "string") {
      return escapeString(chunk);
    }
    if (typeof chunk === "object") {
      const mappedValueAsString = chunk.toString();
      if (mappedValueAsString === "[object Object]") {
        return escapeString(JSON.stringify(chunk));
      }
      return escapeString(mappedValueAsString);
    }
    throw new Error("Unexpected param value: " + chunk);
  }
  getSQL() {
    return this;
  }
  as(alias) {
    if (alias === void 0) {
      return this;
    }
    return new _SQL.Aliased(this, alias);
  }
  mapWith(decoder) {
    this.decoder = typeof decoder === "function" ? { mapFromDriverValue: decoder } : decoder;
    return this;
  }
  inlineParams() {
    this.shouldInlineParams = true;
    return this;
  }
  /**
   * This method is used to conditionally include a part of the query.
   *
   * @param condition - Condition to check
   * @returns itself if the condition is `true`, otherwise `undefined`
   */
  if(condition) {
    return condition ? this : void 0;
  }
};
var Name = class {
  constructor(value) {
    this.value = value;
  }
  static [entityKind] = "Name";
  brand;
  getSQL() {
    return new SQL([this]);
  }
};
function isDriverValueEncoder(value) {
  return typeof value === "object" && value !== null && "mapToDriverValue" in value && typeof value.mapToDriverValue === "function";
}
var noopDecoder = {
  mapFromDriverValue: (value) => value
};
var noopEncoder = {
  mapToDriverValue: (value) => value
};
var noopMapper = {
  ...noopDecoder,
  ...noopEncoder
};
var Param = class {
  /**
   * @param value - Parameter value
   * @param encoder - Encoder to convert the value to a driver parameter
   */
  constructor(value, encoder = noopEncoder) {
    this.value = value;
    this.encoder = encoder;
  }
  static [entityKind] = "Param";
  brand;
  getSQL() {
    return new SQL([this]);
  }
};
function sql(strings, ...params) {
  const queryChunks = [];
  if (params.length > 0 || strings.length > 0 && strings[0] !== "") {
    queryChunks.push(new StringChunk(strings[0]));
  }
  for (const [paramIndex, param2] of params.entries()) {
    queryChunks.push(param2, new StringChunk(strings[paramIndex + 1]));
  }
  return new SQL(queryChunks);
}
((sql2) => {
  function empty() {
    return new SQL([]);
  }
  sql2.empty = empty;
  function fromList(list) {
    return new SQL(list);
  }
  sql2.fromList = fromList;
  function raw(str) {
    return new SQL([new StringChunk(str)]);
  }
  sql2.raw = raw;
  function join(chunks, separator) {
    const result = [];
    for (const [i, chunk] of chunks.entries()) {
      if (i > 0 && separator !== void 0) {
        result.push(separator);
      }
      result.push(chunk);
    }
    return new SQL(result);
  }
  sql2.join = join;
  function identifier(value) {
    return new Name(value);
  }
  sql2.identifier = identifier;
  function placeholder2(name2) {
    return new Placeholder(name2);
  }
  sql2.placeholder = placeholder2;
  function param2(value, encoder) {
    return new Param(value, encoder);
  }
  sql2.param = param2;
})(sql || (sql = {}));
((SQL2) => {
  class Aliased {
    constructor(sql2, fieldAlias) {
      this.sql = sql2;
      this.fieldAlias = fieldAlias;
    }
    static [entityKind] = "SQL.Aliased";
    /** @internal */
    isSelectionField = false;
    getSQL() {
      return this.sql;
    }
    /** @internal */
    clone() {
      return new Aliased(this.sql, this.fieldAlias);
    }
  }
  SQL2.Aliased = Aliased;
})(SQL || (SQL = {}));
var Placeholder = class {
  constructor(name2) {
    this.name = name2;
  }
  static [entityKind] = "Placeholder";
  getSQL() {
    return new SQL([this]);
  }
};
function fillPlaceholders(params, values) {
  return params.map((p) => {
    if (is(p, Placeholder)) {
      if (!(p.name in values)) {
        throw new Error(`No value for placeholder "${p.name}" was provided`);
      }
      return values[p.name];
    }
    if (is(p, Param) && is(p.value, Placeholder)) {
      if (!(p.value.name in values)) {
        throw new Error(`No value for placeholder "${p.value.name}" was provided`);
      }
      return p.encoder.mapToDriverValue(values[p.value.name]);
    }
    return p;
  });
}
var IsDrizzleView = /* @__PURE__ */ Symbol.for("drizzle:IsDrizzleView");
var View = class {
  static [entityKind] = "View";
  /** @internal */
  [ViewBaseConfig];
  /** @internal */
  [IsDrizzleView] = true;
  constructor({ name: name2, schema, selectedFields, query }) {
    this[ViewBaseConfig] = {
      name: name2,
      originalName: name2,
      schema,
      selectedFields,
      query,
      isExisting: !query,
      isAlias: false
    };
  }
  getSQL() {
    return new SQL([this]);
  }
};
Column.prototype.getSQL = function() {
  return new SQL([this]);
};
Table.prototype.getSQL = function() {
  return new SQL([this]);
};
Subquery.prototype.getSQL = function() {
  return new SQL([this]);
};

// ../../node_modules/drizzle-orm/alias.js
var ColumnAliasProxyHandler = class {
  constructor(table) {
    this.table = table;
  }
  static [entityKind] = "ColumnAliasProxyHandler";
  get(columnObj, prop) {
    if (prop === "table") {
      return this.table;
    }
    return columnObj[prop];
  }
};
var TableAliasProxyHandler = class {
  constructor(alias, replaceOriginalName) {
    this.alias = alias;
    this.replaceOriginalName = replaceOriginalName;
  }
  static [entityKind] = "TableAliasProxyHandler";
  get(target, prop) {
    if (prop === Table.Symbol.IsAlias) {
      return true;
    }
    if (prop === Table.Symbol.Name) {
      return this.alias;
    }
    if (this.replaceOriginalName && prop === Table.Symbol.OriginalName) {
      return this.alias;
    }
    if (prop === ViewBaseConfig) {
      return {
        ...target[ViewBaseConfig],
        name: this.alias,
        isAlias: true
      };
    }
    if (prop === Table.Symbol.Columns) {
      const columns = target[Table.Symbol.Columns];
      if (!columns) {
        return columns;
      }
      const proxiedColumns = {};
      Object.keys(columns).map((key) => {
        proxiedColumns[key] = new Proxy(
          columns[key],
          new ColumnAliasProxyHandler(new Proxy(target, this))
        );
      });
      return proxiedColumns;
    }
    const value = target[prop];
    if (is(value, Column)) {
      return new Proxy(value, new ColumnAliasProxyHandler(new Proxy(target, this)));
    }
    return value;
  }
};
var RelationTableAliasProxyHandler = class {
  constructor(alias) {
    this.alias = alias;
  }
  static [entityKind] = "RelationTableAliasProxyHandler";
  get(target, prop) {
    if (prop === "sourceTable") {
      return aliasedTable(target.sourceTable, this.alias);
    }
    return target[prop];
  }
};
function aliasedTable(table, tableAlias) {
  return new Proxy(table, new TableAliasProxyHandler(tableAlias, false));
}
function aliasedTableColumn(column, tableAlias) {
  return new Proxy(
    column,
    new ColumnAliasProxyHandler(new Proxy(column.table, new TableAliasProxyHandler(tableAlias, false)))
  );
}
function mapColumnsInAliasedSQLToAlias(query, alias) {
  return new SQL.Aliased(mapColumnsInSQLToAlias(query.sql, alias), query.fieldAlias);
}
function mapColumnsInSQLToAlias(query, alias) {
  return sql.join(query.queryChunks.map((c) => {
    if (is(c, Column)) {
      return aliasedTableColumn(c, alias);
    }
    if (is(c, SQL)) {
      return mapColumnsInSQLToAlias(c, alias);
    }
    if (is(c, SQL.Aliased)) {
      return mapColumnsInAliasedSQLToAlias(c, alias);
    }
    return c;
  }));
}

// ../../node_modules/drizzle-orm/errors.js
var DrizzleError = class extends Error {
  static [entityKind] = "DrizzleError";
  constructor({ message, cause }) {
    super(message);
    this.name = "DrizzleError";
    this.cause = cause;
  }
};
var DrizzleQueryError = class _DrizzleQueryError extends Error {
  constructor(query, params, cause) {
    super(`Failed query: ${query}
params: ${params}`);
    this.query = query;
    this.params = params;
    this.cause = cause;
    Error.captureStackTrace(this, _DrizzleQueryError);
    if (cause) this.cause = cause;
  }
};
var TransactionRollbackError = class extends DrizzleError {
  static [entityKind] = "TransactionRollbackError";
  constructor() {
    super({ message: "Rollback" });
  }
};

// ../../node_modules/drizzle-orm/logger.js
var ConsoleLogWriter = class {
  static [entityKind] = "ConsoleLogWriter";
  write(message) {
    console.log(message);
  }
};
var DefaultLogger = class {
  static [entityKind] = "DefaultLogger";
  writer;
  constructor(config) {
    this.writer = config?.writer ?? new ConsoleLogWriter();
  }
  logQuery(query, params) {
    const stringifiedParams = params.map((p) => {
      try {
        return JSON.stringify(p);
      } catch {
        return String(p);
      }
    });
    const paramsStr = stringifiedParams.length ? ` -- params: [${stringifiedParams.join(", ")}]` : "";
    this.writer.write(`Query: ${query}${paramsStr}`);
  }
};
var NoopLogger = class {
  static [entityKind] = "NoopLogger";
  logQuery() {
  }
};

// ../../node_modules/drizzle-orm/query-promise.js
var QueryPromise = class {
  static [entityKind] = "QueryPromise";
  [Symbol.toStringTag] = "QueryPromise";
  catch(onRejected) {
    return this.then(void 0, onRejected);
  }
  finally(onFinally) {
    return this.then(
      (value) => {
        onFinally?.();
        return value;
      },
      (reason) => {
        onFinally?.();
        throw reason;
      }
    );
  }
  then(onFulfilled, onRejected) {
    return this.execute().then(onFulfilled, onRejected);
  }
};

// ../../node_modules/drizzle-orm/utils.js
function mapResultRow(columns, row, joinsNotNullableMap) {
  const nullifyMap = {};
  const result = columns.reduce(
    (result2, { path, field }, columnIndex) => {
      let decoder;
      if (is(field, Column)) {
        decoder = field;
      } else if (is(field, SQL)) {
        decoder = field.decoder;
      } else if (is(field, Subquery)) {
        decoder = field._.sql.decoder;
      } else {
        decoder = field.sql.decoder;
      }
      let node = result2;
      for (const [pathChunkIndex, pathChunk] of path.entries()) {
        if (pathChunkIndex < path.length - 1) {
          if (!(pathChunk in node)) {
            node[pathChunk] = {};
          }
          node = node[pathChunk];
        } else {
          const rawValue = row[columnIndex];
          const value = node[pathChunk] = rawValue === null ? null : decoder.mapFromDriverValue(rawValue);
          if (joinsNotNullableMap && is(field, Column) && path.length === 2) {
            const objectName = path[0];
            if (!(objectName in nullifyMap)) {
              nullifyMap[objectName] = value === null ? getTableName(field.table) : false;
            } else if (typeof nullifyMap[objectName] === "string" && nullifyMap[objectName] !== getTableName(field.table)) {
              nullifyMap[objectName] = false;
            }
          }
        }
      }
      return result2;
    },
    {}
  );
  if (joinsNotNullableMap && Object.keys(nullifyMap).length > 0) {
    for (const [objectName, tableName] of Object.entries(nullifyMap)) {
      if (typeof tableName === "string" && !joinsNotNullableMap[tableName]) {
        result[objectName] = null;
      }
    }
  }
  return result;
}
function orderSelectedFields(fields, pathPrefix) {
  return Object.entries(fields).reduce((result, [name, field]) => {
    if (typeof name !== "string") {
      return result;
    }
    const newPath = pathPrefix ? [...pathPrefix, name] : [name];
    if (is(field, Column) || is(field, SQL) || is(field, SQL.Aliased) || is(field, Subquery)) {
      result.push({ path: newPath, field });
    } else if (is(field, Table)) {
      result.push(...orderSelectedFields(field[Table.Symbol.Columns], newPath));
    } else {
      result.push(...orderSelectedFields(field, newPath));
    }
    return result;
  }, []);
}
function haveSameKeys(left, right) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  for (const [index2, key] of leftKeys.entries()) {
    if (key !== rightKeys[index2]) {
      return false;
    }
  }
  return true;
}
function mapUpdateSet(table, values) {
  const entries = Object.entries(values).filter(([, value]) => value !== void 0).map(([key, value]) => {
    if (is(value, SQL) || is(value, Column)) {
      return [key, value];
    } else {
      return [key, new Param(value, table[Table.Symbol.Columns][key])];
    }
  });
  if (entries.length === 0) {
    throw new Error("No values to set");
  }
  return Object.fromEntries(entries);
}
function applyMixins(baseClass, extendedClasses) {
  for (const extendedClass of extendedClasses) {
    for (const name of Object.getOwnPropertyNames(extendedClass.prototype)) {
      if (name === "constructor") continue;
      Object.defineProperty(
        baseClass.prototype,
        name,
        Object.getOwnPropertyDescriptor(extendedClass.prototype, name) || /* @__PURE__ */ Object.create(null)
      );
    }
  }
}
function getTableColumns(table) {
  return table[Table.Symbol.Columns];
}
function getTableLikeName(table) {
  return is(table, Subquery) ? table._.alias : is(table, View) ? table[ViewBaseConfig].name : is(table, SQL) ? void 0 : table[Table.Symbol.IsAlias] ? table[Table.Symbol.Name] : table[Table.Symbol.BaseName];
}
function isConfig(data) {
  if (typeof data !== "object" || data === null) return false;
  if (data.constructor.name !== "Object") return false;
  if ("logger" in data) {
    const type = typeof data["logger"];
    if (type !== "boolean" && (type !== "object" || typeof data["logger"]["logQuery"] !== "function") && type !== "undefined") return false;
    return true;
  }
  if ("schema" in data) {
    const type = typeof data["schema"];
    if (type !== "object" && type !== "undefined") return false;
    return true;
  }
  if ("casing" in data) {
    const type = typeof data["casing"];
    if (type !== "string" && type !== "undefined") return false;
    return true;
  }
  if ("mode" in data) {
    if (data["mode"] !== "default" || data["mode"] !== "planetscale" || data["mode"] !== void 0) return false;
    return true;
  }
  if ("connection" in data) {
    const type = typeof data["connection"];
    if (type !== "string" && type !== "object" && type !== "undefined") return false;
    return true;
  }
  if ("client" in data) {
    const type = typeof data["client"];
    if (type !== "object" && type !== "function" && type !== "undefined") return false;
    return true;
  }
  if (Object.keys(data).length === 0) return true;
  return false;
}
var textDecoder = typeof TextDecoder === "undefined" ? null : new TextDecoder();

// ../../node_modules/drizzle-orm/pg-core/columns/date.common.js
var PgDateColumnBaseBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgDateColumnBaseBuilder";
  defaultNow() {
    return this.default(sql`now()`);
  }
};

// ../../node_modules/drizzle-orm/pg-core/columns/date.js
var PgDateBuilder = class extends PgDateColumnBaseBuilder {
  static [entityKind] = "PgDateBuilder";
  constructor(name) {
    super(name, "date", "PgDate");
  }
  /** @internal */
  build(table) {
    return new PgDate(table, this.config);
  }
};
var PgDate = class extends PgColumn {
  static [entityKind] = "PgDate";
  getSQLType() {
    return "date";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") return new Date(value);
    return value;
  }
  mapToDriverValue(value) {
    return value.toISOString();
  }
};
var PgDateStringBuilder = class extends PgDateColumnBaseBuilder {
  static [entityKind] = "PgDateStringBuilder";
  constructor(name) {
    super(name, "string", "PgDateString");
  }
  /** @internal */
  build(table) {
    return new PgDateString(
      table,
      this.config
    );
  }
};
var PgDateString = class extends PgColumn {
  static [entityKind] = "PgDateString";
  getSQLType() {
    return "date";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") return value;
    return value.toISOString().slice(0, -14);
  }
};

// ../../node_modules/drizzle-orm/pg-core/columns/json.js
var PgJsonBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgJsonBuilder";
  constructor(name) {
    super(name, "json", "PgJson");
  }
  /** @internal */
  build(table) {
    return new PgJson(table, this.config);
  }
};
var PgJson = class extends PgColumn {
  static [entityKind] = "PgJson";
  constructor(table, config) {
    super(table, config);
  }
  getSQLType() {
    return "json";
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }
};

// ../../node_modules/drizzle-orm/pg-core/columns/jsonb.js
var PgJsonbBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgJsonbBuilder";
  constructor(name) {
    super(name, "json", "PgJsonb");
  }
  /** @internal */
  build(table) {
    return new PgJsonb(table, this.config);
  }
};
var PgJsonb = class extends PgColumn {
  static [entityKind] = "PgJsonb";
  constructor(table, config) {
    super(table, config);
  }
  getSQLType() {
    return "jsonb";
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }
};

// ../../node_modules/drizzle-orm/pg-core/columns/numeric.js
var PgNumericBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgNumericBuilder";
  constructor(name, precision, scale) {
    super(name, "string", "PgNumeric");
    this.config.precision = precision;
    this.config.scale = scale;
  }
  /** @internal */
  build(table) {
    return new PgNumeric(table, this.config);
  }
};
var PgNumeric = class extends PgColumn {
  static [entityKind] = "PgNumeric";
  precision;
  scale;
  constructor(table, config) {
    super(table, config);
    this.precision = config.precision;
    this.scale = config.scale;
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") return value;
    return String(value);
  }
  getSQLType() {
    if (this.precision !== void 0 && this.scale !== void 0) {
      return `numeric(${this.precision}, ${this.scale})`;
    } else if (this.precision === void 0) {
      return "numeric";
    } else {
      return `numeric(${this.precision})`;
    }
  }
};
var PgNumericNumberBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgNumericNumberBuilder";
  constructor(name, precision, scale) {
    super(name, "number", "PgNumericNumber");
    this.config.precision = precision;
    this.config.scale = scale;
  }
  /** @internal */
  build(table) {
    return new PgNumericNumber(
      table,
      this.config
    );
  }
};
var PgNumericNumber = class extends PgColumn {
  static [entityKind] = "PgNumericNumber";
  precision;
  scale;
  constructor(table, config) {
    super(table, config);
    this.precision = config.precision;
    this.scale = config.scale;
  }
  mapFromDriverValue(value) {
    if (typeof value === "number") return value;
    return Number(value);
  }
  mapToDriverValue = String;
  getSQLType() {
    if (this.precision !== void 0 && this.scale !== void 0) {
      return `numeric(${this.precision}, ${this.scale})`;
    } else if (this.precision === void 0) {
      return "numeric";
    } else {
      return `numeric(${this.precision})`;
    }
  }
};
var PgNumericBigIntBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgNumericBigIntBuilder";
  constructor(name, precision, scale) {
    super(name, "bigint", "PgNumericBigInt");
    this.config.precision = precision;
    this.config.scale = scale;
  }
  /** @internal */
  build(table) {
    return new PgNumericBigInt(
      table,
      this.config
    );
  }
};
var PgNumericBigInt = class extends PgColumn {
  static [entityKind] = "PgNumericBigInt";
  precision;
  scale;
  constructor(table, config) {
    super(table, config);
    this.precision = config.precision;
    this.scale = config.scale;
  }
  mapFromDriverValue = BigInt;
  mapToDriverValue = String;
  getSQLType() {
    if (this.precision !== void 0 && this.scale !== void 0) {
      return `numeric(${this.precision}, ${this.scale})`;
    } else if (this.precision === void 0) {
      return "numeric";
    } else {
      return `numeric(${this.precision})`;
    }
  }
};

// ../../node_modules/drizzle-orm/pg-core/columns/time.js
var PgTimeBuilder = class extends PgDateColumnBaseBuilder {
  constructor(name, withTimezone, precision) {
    super(name, "string", "PgTime");
    this.withTimezone = withTimezone;
    this.precision = precision;
    this.config.withTimezone = withTimezone;
    this.config.precision = precision;
  }
  static [entityKind] = "PgTimeBuilder";
  /** @internal */
  build(table) {
    return new PgTime(table, this.config);
  }
};
var PgTime = class extends PgColumn {
  static [entityKind] = "PgTime";
  withTimezone;
  precision;
  constructor(table, config) {
    super(table, config);
    this.withTimezone = config.withTimezone;
    this.precision = config.precision;
  }
  getSQLType() {
    const precision = this.precision === void 0 ? "" : `(${this.precision})`;
    return `time${precision}${this.withTimezone ? " with time zone" : ""}`;
  }
};

// ../../node_modules/drizzle-orm/pg-core/columns/timestamp.js
var PgTimestampBuilder = class extends PgDateColumnBaseBuilder {
  static [entityKind] = "PgTimestampBuilder";
  constructor(name, withTimezone, precision) {
    super(name, "date", "PgTimestamp");
    this.config.withTimezone = withTimezone;
    this.config.precision = precision;
  }
  /** @internal */
  build(table) {
    return new PgTimestamp(table, this.config);
  }
};
var PgTimestamp = class extends PgColumn {
  static [entityKind] = "PgTimestamp";
  withTimezone;
  precision;
  constructor(table, config) {
    super(table, config);
    this.withTimezone = config.withTimezone;
    this.precision = config.precision;
  }
  getSQLType() {
    const precision = this.precision === void 0 ? "" : ` (${this.precision})`;
    return `timestamp${precision}${this.withTimezone ? " with time zone" : ""}`;
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") return new Date(this.withTimezone ? value : value + "+0000");
    return value;
  }
  mapToDriverValue = (value) => {
    return value.toISOString();
  };
};
var PgTimestampStringBuilder = class extends PgDateColumnBaseBuilder {
  static [entityKind] = "PgTimestampStringBuilder";
  constructor(name, withTimezone, precision) {
    super(name, "string", "PgTimestampString");
    this.config.withTimezone = withTimezone;
    this.config.precision = precision;
  }
  /** @internal */
  build(table) {
    return new PgTimestampString(
      table,
      this.config
    );
  }
};
var PgTimestampString = class extends PgColumn {
  static [entityKind] = "PgTimestampString";
  withTimezone;
  precision;
  constructor(table, config) {
    super(table, config);
    this.withTimezone = config.withTimezone;
    this.precision = config.precision;
  }
  getSQLType() {
    const precision = this.precision === void 0 ? "" : `(${this.precision})`;
    return `timestamp${precision}${this.withTimezone ? " with time zone" : ""}`;
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") return value;
    const shortened = value.toISOString().slice(0, -1).replace("T", " ");
    if (this.withTimezone) {
      const offset = value.getTimezoneOffset();
      const sign = offset <= 0 ? "+" : "-";
      return `${shortened}${sign}${Math.floor(Math.abs(offset) / 60).toString().padStart(2, "0")}`;
    }
    return shortened;
  }
};

// ../../node_modules/drizzle-orm/pg-core/columns/uuid.js
var PgUUIDBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgUUIDBuilder";
  constructor(name) {
    super(name, "string", "PgUUID");
  }
  /**
   * Adds `default gen_random_uuid()` to the column definition.
   */
  defaultRandom() {
    return this.default(sql`gen_random_uuid()`);
  }
  /** @internal */
  build(table) {
    return new PgUUID(table, this.config);
  }
};
var PgUUID = class extends PgColumn {
  static [entityKind] = "PgUUID";
  getSQLType() {
    return "uuid";
  }
};

// ../../node_modules/drizzle-orm/pg-core/table.js
var InlineForeignKeys = /* @__PURE__ */ Symbol.for("drizzle:PgInlineForeignKeys");
var EnableRLS = /* @__PURE__ */ Symbol.for("drizzle:EnableRLS");
var PgTable = class extends Table {
  static [entityKind] = "PgTable";
  /** @internal */
  static Symbol = Object.assign({}, Table.Symbol, {
    InlineForeignKeys,
    EnableRLS
  });
  /**@internal */
  [InlineForeignKeys] = [];
  /** @internal */
  [EnableRLS] = false;
  /** @internal */
  [Table.Symbol.ExtraConfigBuilder] = void 0;
  /** @internal */
  [Table.Symbol.ExtraConfigColumns] = {};
};

// ../../node_modules/drizzle-orm/pg-core/primary-keys.js
var PrimaryKeyBuilder = class {
  static [entityKind] = "PgPrimaryKeyBuilder";
  /** @internal */
  columns;
  /** @internal */
  name;
  constructor(columns, name) {
    this.columns = columns;
    this.name = name;
  }
  /** @internal */
  build(table) {
    return new PrimaryKey(table, this.columns, this.name);
  }
};
var PrimaryKey = class {
  constructor(table, columns, name) {
    this.table = table;
    this.columns = columns;
    this.name = name;
  }
  static [entityKind] = "PgPrimaryKey";
  columns;
  name;
  getName() {
    return this.name ?? `${this.table[PgTable.Symbol.Name]}_${this.columns.map((column) => column.name).join("_")}_pk`;
  }
};

// ../../node_modules/drizzle-orm/sql/expressions/conditions.js
function bindIfParam(value, column) {
  if (isDriverValueEncoder(column) && !isSQLWrapper(value) && !is(value, Param) && !is(value, Placeholder) && !is(value, Column) && !is(value, Table) && !is(value, View)) {
    return new Param(value, column);
  }
  return value;
}
var eq = (left, right) => {
  return sql`${left} = ${bindIfParam(right, left)}`;
};
var ne = (left, right) => {
  return sql`${left} <> ${bindIfParam(right, left)}`;
};
function and(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk("("),
    sql.join(conditions, new StringChunk(" and ")),
    new StringChunk(")")
  ]);
}
function or(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk("("),
    sql.join(conditions, new StringChunk(" or ")),
    new StringChunk(")")
  ]);
}
function not(condition) {
  return sql`not ${condition}`;
}
var gt = (left, right) => {
  return sql`${left} > ${bindIfParam(right, left)}`;
};
var gte = (left, right) => {
  return sql`${left} >= ${bindIfParam(right, left)}`;
};
var lt = (left, right) => {
  return sql`${left} < ${bindIfParam(right, left)}`;
};
var lte = (left, right) => {
  return sql`${left} <= ${bindIfParam(right, left)}`;
};
function inArray(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      return sql`false`;
    }
    return sql`${column} in ${values.map((v) => bindIfParam(v, column))}`;
  }
  return sql`${column} in ${bindIfParam(values, column)}`;
}
function notInArray(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      return sql`true`;
    }
    return sql`${column} not in ${values.map((v) => bindIfParam(v, column))}`;
  }
  return sql`${column} not in ${bindIfParam(values, column)}`;
}
function isNull(value) {
  return sql`${value} is null`;
}
function isNotNull(value) {
  return sql`${value} is not null`;
}
function exists(subquery) {
  return sql`exists ${subquery}`;
}
function notExists(subquery) {
  return sql`not exists ${subquery}`;
}
function between(column, min, max) {
  return sql`${column} between ${bindIfParam(min, column)} and ${bindIfParam(
    max,
    column
  )}`;
}
function notBetween(column, min, max) {
  return sql`${column} not between ${bindIfParam(
    min,
    column
  )} and ${bindIfParam(max, column)}`;
}
function like(column, value) {
  return sql`${column} like ${value}`;
}
function notLike(column, value) {
  return sql`${column} not like ${value}`;
}
function ilike(column, value) {
  return sql`${column} ilike ${value}`;
}
function notIlike(column, value) {
  return sql`${column} not ilike ${value}`;
}

// ../../node_modules/drizzle-orm/sql/expressions/select.js
function asc(column) {
  return sql`${column} asc`;
}
function desc(column) {
  return sql`${column} desc`;
}

// ../../node_modules/drizzle-orm/relations.js
var Relation = class {
  constructor(sourceTable, referencedTable, relationName) {
    this.sourceTable = sourceTable;
    this.referencedTable = referencedTable;
    this.relationName = relationName;
    this.referencedTableName = referencedTable[Table.Symbol.Name];
  }
  static [entityKind] = "Relation";
  referencedTableName;
  fieldName;
};
var Relations = class {
  constructor(table, config) {
    this.table = table;
    this.config = config;
  }
  static [entityKind] = "Relations";
};
var One = class _One extends Relation {
  constructor(sourceTable, referencedTable, config, isNullable) {
    super(sourceTable, referencedTable, config?.relationName);
    this.config = config;
    this.isNullable = isNullable;
  }
  static [entityKind] = "One";
  withFieldName(fieldName) {
    const relation = new _One(
      this.sourceTable,
      this.referencedTable,
      this.config,
      this.isNullable
    );
    relation.fieldName = fieldName;
    return relation;
  }
};
var Many = class _Many extends Relation {
  constructor(sourceTable, referencedTable, config) {
    super(sourceTable, referencedTable, config?.relationName);
    this.config = config;
  }
  static [entityKind] = "Many";
  withFieldName(fieldName) {
    const relation = new _Many(
      this.sourceTable,
      this.referencedTable,
      this.config
    );
    relation.fieldName = fieldName;
    return relation;
  }
};
function getOperators() {
  return {
    and,
    between,
    eq,
    exists,
    gt,
    gte,
    ilike,
    inArray,
    isNull,
    isNotNull,
    like,
    lt,
    lte,
    ne,
    not,
    notBetween,
    notExists,
    notLike,
    notIlike,
    notInArray,
    or,
    sql
  };
}
function getOrderByOperators() {
  return {
    sql,
    asc,
    desc
  };
}
function extractTablesRelationalConfig(schema, configHelpers) {
  if (Object.keys(schema).length === 1 && "default" in schema && !is(schema["default"], Table)) {
    schema = schema["default"];
  }
  const tableNamesMap = {};
  const relationsBuffer = {};
  const tablesConfig = {};
  for (const [key, value] of Object.entries(schema)) {
    if (is(value, Table)) {
      const dbName = getTableUniqueName(value);
      const bufferedRelations = relationsBuffer[dbName];
      tableNamesMap[dbName] = key;
      tablesConfig[key] = {
        tsName: key,
        dbName: value[Table.Symbol.Name],
        schema: value[Table.Symbol.Schema],
        columns: value[Table.Symbol.Columns],
        relations: bufferedRelations?.relations ?? {},
        primaryKey: bufferedRelations?.primaryKey ?? []
      };
      for (const column of Object.values(
        value[Table.Symbol.Columns]
      )) {
        if (column.primary) {
          tablesConfig[key].primaryKey.push(column);
        }
      }
      const extraConfig = value[Table.Symbol.ExtraConfigBuilder]?.(value[Table.Symbol.ExtraConfigColumns]);
      if (extraConfig) {
        for (const configEntry of Object.values(extraConfig)) {
          if (is(configEntry, PrimaryKeyBuilder)) {
            tablesConfig[key].primaryKey.push(...configEntry.columns);
          }
        }
      }
    } else if (is(value, Relations)) {
      const dbName = getTableUniqueName(value.table);
      const tableName = tableNamesMap[dbName];
      const relations2 = value.config(
        configHelpers(value.table)
      );
      let primaryKey;
      for (const [relationName, relation] of Object.entries(relations2)) {
        if (tableName) {
          const tableConfig = tablesConfig[tableName];
          tableConfig.relations[relationName] = relation;
          if (primaryKey) {
            tableConfig.primaryKey.push(...primaryKey);
          }
        } else {
          if (!(dbName in relationsBuffer)) {
            relationsBuffer[dbName] = {
              relations: {},
              primaryKey
            };
          }
          relationsBuffer[dbName].relations[relationName] = relation;
        }
      }
    }
  }
  return { tables: tablesConfig, tableNamesMap };
}
function createOne(sourceTable) {
  return function one(table, config) {
    return new One(
      sourceTable,
      table,
      config,
      config?.fields.reduce((res, f) => res && f.notNull, true) ?? false
    );
  };
}
function createMany(sourceTable) {
  return function many(referencedTable, config) {
    return new Many(sourceTable, referencedTable, config);
  };
}
function normalizeRelation(schema, tableNamesMap, relation) {
  if (is(relation, One) && relation.config) {
    return {
      fields: relation.config.fields,
      references: relation.config.references
    };
  }
  const referencedTableTsName = tableNamesMap[getTableUniqueName(relation.referencedTable)];
  if (!referencedTableTsName) {
    throw new Error(
      `Table "${relation.referencedTable[Table.Symbol.Name]}" not found in schema`
    );
  }
  const referencedTableConfig = schema[referencedTableTsName];
  if (!referencedTableConfig) {
    throw new Error(`Table "${referencedTableTsName}" not found in schema`);
  }
  const sourceTable = relation.sourceTable;
  const sourceTableTsName = tableNamesMap[getTableUniqueName(sourceTable)];
  if (!sourceTableTsName) {
    throw new Error(
      `Table "${sourceTable[Table.Symbol.Name]}" not found in schema`
    );
  }
  const reverseRelations = [];
  for (const referencedTableRelation of Object.values(
    referencedTableConfig.relations
  )) {
    if (relation.relationName && relation !== referencedTableRelation && referencedTableRelation.relationName === relation.relationName || !relation.relationName && referencedTableRelation.referencedTable === relation.sourceTable) {
      reverseRelations.push(referencedTableRelation);
    }
  }
  if (reverseRelations.length > 1) {
    throw relation.relationName ? new Error(
      `There are multiple relations with name "${relation.relationName}" in table "${referencedTableTsName}"`
    ) : new Error(
      `There are multiple relations between "${referencedTableTsName}" and "${relation.sourceTable[Table.Symbol.Name]}". Please specify relation name`
    );
  }
  if (reverseRelations[0] && is(reverseRelations[0], One) && reverseRelations[0].config) {
    return {
      fields: reverseRelations[0].config.references,
      references: reverseRelations[0].config.fields
    };
  }
  throw new Error(
    `There is not enough information to infer relation "${sourceTableTsName}.${relation.fieldName}"`
  );
}
function createTableRelationsHelpers(sourceTable) {
  return {
    one: createOne(sourceTable),
    many: createMany(sourceTable)
  };
}
function mapRelationalRow(tablesConfig, tableConfig, row, buildQueryResultSelection, mapColumnValue = (value) => value) {
  const result = {};
  for (const [
    selectionItemIndex,
    selectionItem
  ] of buildQueryResultSelection.entries()) {
    if (selectionItem.isJson) {
      const relation = tableConfig.relations[selectionItem.tsKey];
      const rawSubRows = row[selectionItemIndex];
      const subRows = typeof rawSubRows === "string" ? JSON.parse(rawSubRows) : rawSubRows;
      result[selectionItem.tsKey] = is(relation, One) ? subRows && mapRelationalRow(
        tablesConfig,
        tablesConfig[selectionItem.relationTableTsKey],
        subRows,
        selectionItem.selection,
        mapColumnValue
      ) : subRows.map(
        (subRow) => mapRelationalRow(
          tablesConfig,
          tablesConfig[selectionItem.relationTableTsKey],
          subRow,
          selectionItem.selection,
          mapColumnValue
        )
      );
    } else {
      const value = mapColumnValue(row[selectionItemIndex]);
      const field = selectionItem.field;
      let decoder;
      if (is(field, Column)) {
        decoder = field;
      } else if (is(field, SQL)) {
        decoder = field.decoder;
      } else {
        decoder = field.sql.decoder;
      }
      result[selectionItem.tsKey] = value === null ? null : decoder.mapFromDriverValue(value);
    }
  }
  return result;
}

// ../../node_modules/drizzle-orm/sql/functions/aggregate.js
function count(expression) {
  return sql`count(${expression || sql.raw("*")})`.mapWith(Number);
}
function sum(expression) {
  return sql`sum(${expression})`.mapWith(String);
}

// ../../node_modules/drizzle-orm/postgres-js/driver.js
import pgClient from "postgres";

// ../../node_modules/drizzle-orm/selection-proxy.js
var SelectionProxyHandler = class _SelectionProxyHandler {
  static [entityKind] = "SelectionProxyHandler";
  config;
  constructor(config) {
    this.config = { ...config };
  }
  get(subquery, prop) {
    if (prop === "_") {
      return {
        ...subquery["_"],
        selectedFields: new Proxy(
          subquery._.selectedFields,
          this
        )
      };
    }
    if (prop === ViewBaseConfig) {
      return {
        ...subquery[ViewBaseConfig],
        selectedFields: new Proxy(
          subquery[ViewBaseConfig].selectedFields,
          this
        )
      };
    }
    if (typeof prop === "symbol") {
      return subquery[prop];
    }
    const columns = is(subquery, Subquery) ? subquery._.selectedFields : is(subquery, View) ? subquery[ViewBaseConfig].selectedFields : subquery;
    const value = columns[prop];
    if (is(value, SQL.Aliased)) {
      if (this.config.sqlAliasedBehavior === "sql" && !value.isSelectionField) {
        return value.sql;
      }
      const newValue = value.clone();
      newValue.isSelectionField = true;
      return newValue;
    }
    if (is(value, SQL)) {
      if (this.config.sqlBehavior === "sql") {
        return value;
      }
      throw new Error(
        `You tried to reference "${prop}" field from a subquery, which is a raw SQL field, but it doesn't have an alias declared. Please add an alias to the field using ".as('alias')" method.`
      );
    }
    if (is(value, Column)) {
      if (this.config.alias) {
        return new Proxy(
          value,
          new ColumnAliasProxyHandler(
            new Proxy(
              value.table,
              new TableAliasProxyHandler(this.config.alias, this.config.replaceOriginalName ?? false)
            )
          )
        );
      }
      return value;
    }
    if (typeof value !== "object" || value === null) {
      return value;
    }
    return new Proxy(value, new _SelectionProxyHandler(this.config));
  }
};

// ../../node_modules/drizzle-orm/casing.js
function toSnakeCase(input) {
  const words = input.replace(/['\u2019]/g, "").match(/[\da-z]+|[A-Z]+(?![a-z])|[A-Z][\da-z]+/g) ?? [];
  return words.map((word) => word.toLowerCase()).join("_");
}
function toCamelCase(input) {
  const words = input.replace(/['\u2019]/g, "").match(/[\da-z]+|[A-Z]+(?![a-z])|[A-Z][\da-z]+/g) ?? [];
  return words.reduce((acc, word, i) => {
    const formattedWord = i === 0 ? word.toLowerCase() : `${word[0].toUpperCase()}${word.slice(1)}`;
    return acc + formattedWord;
  }, "");
}
function noopCase(input) {
  return input;
}
var CasingCache = class {
  static [entityKind] = "CasingCache";
  /** @internal */
  cache = {};
  cachedTables = {};
  convert;
  constructor(casing) {
    this.convert = casing === "snake_case" ? toSnakeCase : casing === "camelCase" ? toCamelCase : noopCase;
  }
  getColumnCasing(column) {
    if (!column.keyAsName) return column.name;
    const schema = column.table[Table.Symbol.Schema] ?? "public";
    const tableName = column.table[Table.Symbol.OriginalName];
    const key = `${schema}.${tableName}.${column.name}`;
    if (!this.cache[key]) {
      this.cacheTable(column.table);
    }
    return this.cache[key];
  }
  cacheTable(table) {
    const schema = table[Table.Symbol.Schema] ?? "public";
    const tableName = table[Table.Symbol.OriginalName];
    const tableKey = `${schema}.${tableName}`;
    if (!this.cachedTables[tableKey]) {
      for (const column of Object.values(table[Table.Symbol.Columns])) {
        const columnKey = `${tableKey}.${column.name}`;
        this.cache[columnKey] = this.convert(column.name);
      }
      this.cachedTables[tableKey] = true;
    }
  }
  clearCache() {
    this.cache = {};
    this.cachedTables = {};
  }
};

// ../../node_modules/drizzle-orm/pg-core/view-base.js
var PgViewBase = class extends View {
  static [entityKind] = "PgViewBase";
};

// ../../node_modules/drizzle-orm/pg-core/dialect.js
var PgDialect = class {
  static [entityKind] = "PgDialect";
  /** @internal */
  casing;
  constructor(config) {
    this.casing = new CasingCache(config?.casing);
  }
  async migrate(migrations, session, config) {
    const migrationsTable = typeof config === "string" ? "__drizzle_migrations" : config.migrationsTable ?? "__drizzle_migrations";
    const migrationsSchema = typeof config === "string" ? "drizzle" : config.migrationsSchema ?? "drizzle";
    const migrationTableCreate = sql`
			CREATE TABLE IF NOT EXISTS ${sql.identifier(migrationsSchema)}.${sql.identifier(migrationsTable)} (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at bigint
			)
		`;
    await session.execute(sql`CREATE SCHEMA IF NOT EXISTS ${sql.identifier(migrationsSchema)}`);
    await session.execute(migrationTableCreate);
    const dbMigrations = await session.all(
      sql`select id, hash, created_at from ${sql.identifier(migrationsSchema)}.${sql.identifier(migrationsTable)} order by created_at desc limit 1`
    );
    const lastDbMigration = dbMigrations[0];
    await session.transaction(async (tx) => {
      for await (const migration of migrations) {
        if (!lastDbMigration || Number(lastDbMigration.created_at) < migration.folderMillis) {
          for (const stmt of migration.sql) {
            await tx.execute(sql.raw(stmt));
          }
          await tx.execute(
            sql`insert into ${sql.identifier(migrationsSchema)}.${sql.identifier(migrationsTable)} ("hash", "created_at") values(${migration.hash}, ${migration.folderMillis})`
          );
        }
      }
    });
  }
  escapeName(name) {
    return `"${name.replace(/"/g, '""')}"`;
  }
  escapeParam(num) {
    return `$${num + 1}`;
  }
  escapeString(str) {
    return `'${str.replace(/'/g, "''")}'`;
  }
  buildWithCTE(queries) {
    if (!queries?.length) return void 0;
    const withSqlChunks = [sql`with `];
    for (const [i, w] of queries.entries()) {
      withSqlChunks.push(sql`${sql.identifier(w._.alias)} as (${w._.sql})`);
      if (i < queries.length - 1) {
        withSqlChunks.push(sql`, `);
      }
    }
    withSqlChunks.push(sql` `);
    return sql.join(withSqlChunks);
  }
  buildDeleteQuery({ table, where, returning, withList }) {
    const withSql = this.buildWithCTE(withList);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const whereSql = where ? sql` where ${where}` : void 0;
    return sql`${withSql}delete from ${table}${whereSql}${returningSql}`;
  }
  buildUpdateSet(table, set) {
    const tableColumns = table[Table.Symbol.Columns];
    const columnNames = Object.keys(tableColumns).filter(
      (colName) => set[colName] !== void 0 || tableColumns[colName]?.onUpdateFn !== void 0
    );
    const setSize = columnNames.length;
    return sql.join(columnNames.flatMap((colName, i) => {
      const col = tableColumns[colName];
      const onUpdateFnResult = col.onUpdateFn?.();
      const value = set[colName] ?? (is(onUpdateFnResult, SQL) ? onUpdateFnResult : sql.param(onUpdateFnResult, col));
      const res = sql`${sql.identifier(this.casing.getColumnCasing(col))} = ${value}`;
      if (i < setSize - 1) {
        return [res, sql.raw(", ")];
      }
      return [res];
    }));
  }
  buildUpdateQuery({ table, set, where, returning, withList, from, joins }) {
    const withSql = this.buildWithCTE(withList);
    const tableName = table[PgTable.Symbol.Name];
    const tableSchema = table[PgTable.Symbol.Schema];
    const origTableName = table[PgTable.Symbol.OriginalName];
    const alias = tableName === origTableName ? void 0 : tableName;
    const tableSql = sql`${tableSchema ? sql`${sql.identifier(tableSchema)}.` : void 0}${sql.identifier(origTableName)}${alias && sql` ${sql.identifier(alias)}`}`;
    const setSql = this.buildUpdateSet(table, set);
    const fromSql = from && sql.join([sql.raw(" from "), this.buildFromTable(from)]);
    const joinsSql = this.buildJoins(joins);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: !from })}` : void 0;
    const whereSql = where ? sql` where ${where}` : void 0;
    return sql`${withSql}update ${tableSql} set ${setSql}${fromSql}${joinsSql}${whereSql}${returningSql}`;
  }
  /**
   * Builds selection SQL with provided fields/expressions
   *
   * Examples:
   *
   * `select <selection> from`
   *
   * `insert ... returning <selection>`
   *
   * If `isSingleTable` is true, then columns won't be prefixed with table name
   */
  buildSelection(fields, { isSingleTable = false } = {}) {
    const columnsLen = fields.length;
    const chunks = fields.flatMap(({ field }, i) => {
      const chunk = [];
      if (is(field, SQL.Aliased) && field.isSelectionField) {
        chunk.push(sql.identifier(field.fieldAlias));
      } else if (is(field, SQL.Aliased) || is(field, SQL)) {
        const query = is(field, SQL.Aliased) ? field.sql : field;
        if (isSingleTable) {
          chunk.push(
            new SQL(
              query.queryChunks.map((c) => {
                if (is(c, PgColumn)) {
                  return sql.identifier(this.casing.getColumnCasing(c));
                }
                return c;
              })
            )
          );
        } else {
          chunk.push(query);
        }
        if (is(field, SQL.Aliased)) {
          chunk.push(sql` as ${sql.identifier(field.fieldAlias)}`);
        }
      } else if (is(field, Column)) {
        if (isSingleTable) {
          chunk.push(sql.identifier(this.casing.getColumnCasing(field)));
        } else {
          chunk.push(field);
        }
      } else if (is(field, Subquery)) {
        const entries = Object.entries(field._.selectedFields);
        if (entries.length === 1) {
          const entry = entries[0][1];
          const fieldDecoder = is(entry, SQL) ? entry.decoder : is(entry, Column) ? { mapFromDriverValue: (v) => entry.mapFromDriverValue(v) } : entry.sql.decoder;
          if (fieldDecoder) {
            field._.sql.decoder = fieldDecoder;
          }
        }
        chunk.push(field);
      }
      if (i < columnsLen - 1) {
        chunk.push(sql`, `);
      }
      return chunk;
    });
    return sql.join(chunks);
  }
  buildJoins(joins) {
    if (!joins || joins.length === 0) {
      return void 0;
    }
    const joinsArray = [];
    for (const [index2, joinMeta] of joins.entries()) {
      if (index2 === 0) {
        joinsArray.push(sql` `);
      }
      const table = joinMeta.table;
      const lateralSql = joinMeta.lateral ? sql` lateral` : void 0;
      const onSql = joinMeta.on ? sql` on ${joinMeta.on}` : void 0;
      if (is(table, PgTable)) {
        const tableName = table[PgTable.Symbol.Name];
        const tableSchema = table[PgTable.Symbol.Schema];
        const origTableName = table[PgTable.Symbol.OriginalName];
        const alias = tableName === origTableName ? void 0 : joinMeta.alias;
        joinsArray.push(
          sql`${sql.raw(joinMeta.joinType)} join${lateralSql} ${tableSchema ? sql`${sql.identifier(tableSchema)}.` : void 0}${sql.identifier(origTableName)}${alias && sql` ${sql.identifier(alias)}`}${onSql}`
        );
      } else if (is(table, View)) {
        const viewName = table[ViewBaseConfig].name;
        const viewSchema = table[ViewBaseConfig].schema;
        const origViewName = table[ViewBaseConfig].originalName;
        const alias = viewName === origViewName ? void 0 : joinMeta.alias;
        joinsArray.push(
          sql`${sql.raw(joinMeta.joinType)} join${lateralSql} ${viewSchema ? sql`${sql.identifier(viewSchema)}.` : void 0}${sql.identifier(origViewName)}${alias && sql` ${sql.identifier(alias)}`}${onSql}`
        );
      } else {
        joinsArray.push(
          sql`${sql.raw(joinMeta.joinType)} join${lateralSql} ${table}${onSql}`
        );
      }
      if (index2 < joins.length - 1) {
        joinsArray.push(sql` `);
      }
    }
    return sql.join(joinsArray);
  }
  buildFromTable(table) {
    if (is(table, Table) && table[Table.Symbol.IsAlias]) {
      let fullName = sql`${sql.identifier(table[Table.Symbol.OriginalName])}`;
      if (table[Table.Symbol.Schema]) {
        fullName = sql`${sql.identifier(table[Table.Symbol.Schema])}.${fullName}`;
      }
      return sql`${fullName} ${sql.identifier(table[Table.Symbol.Name])}`;
    }
    return table;
  }
  buildSelectQuery({
    withList,
    fields,
    fieldsFlat,
    where,
    having,
    table,
    joins,
    orderBy,
    groupBy,
    limit,
    offset,
    lockingClause,
    distinct,
    setOperators
  }) {
    const fieldsList = fieldsFlat ?? orderSelectedFields(fields);
    for (const f of fieldsList) {
      if (is(f.field, Column) && getTableName(f.field.table) !== (is(table, Subquery) ? table._.alias : is(table, PgViewBase) ? table[ViewBaseConfig].name : is(table, SQL) ? void 0 : getTableName(table)) && !((table2) => joins?.some(
        ({ alias }) => alias === (table2[Table.Symbol.IsAlias] ? getTableName(table2) : table2[Table.Symbol.BaseName])
      ))(f.field.table)) {
        const tableName = getTableName(f.field.table);
        throw new Error(
          `Your "${f.path.join("->")}" field references a column "${tableName}"."${f.field.name}", but the table "${tableName}" is not part of the query! Did you forget to join it?`
        );
      }
    }
    const isSingleTable = !joins || joins.length === 0;
    const withSql = this.buildWithCTE(withList);
    let distinctSql;
    if (distinct) {
      distinctSql = distinct === true ? sql` distinct` : sql` distinct on (${sql.join(distinct.on, sql`, `)})`;
    }
    const selection = this.buildSelection(fieldsList, { isSingleTable });
    const tableSql = this.buildFromTable(table);
    const joinsSql = this.buildJoins(joins);
    const whereSql = where ? sql` where ${where}` : void 0;
    const havingSql = having ? sql` having ${having}` : void 0;
    let orderBySql;
    if (orderBy && orderBy.length > 0) {
      orderBySql = sql` order by ${sql.join(orderBy, sql`, `)}`;
    }
    let groupBySql;
    if (groupBy && groupBy.length > 0) {
      groupBySql = sql` group by ${sql.join(groupBy, sql`, `)}`;
    }
    const limitSql = typeof limit === "object" || typeof limit === "number" && limit >= 0 ? sql` limit ${limit}` : void 0;
    const offsetSql = offset ? sql` offset ${offset}` : void 0;
    const lockingClauseSql = sql.empty();
    if (lockingClause) {
      const clauseSql = sql` for ${sql.raw(lockingClause.strength)}`;
      if (lockingClause.config.of) {
        clauseSql.append(
          sql` of ${sql.join(
            Array.isArray(lockingClause.config.of) ? lockingClause.config.of : [lockingClause.config.of],
            sql`, `
          )}`
        );
      }
      if (lockingClause.config.noWait) {
        clauseSql.append(sql` nowait`);
      } else if (lockingClause.config.skipLocked) {
        clauseSql.append(sql` skip locked`);
      }
      lockingClauseSql.append(clauseSql);
    }
    const finalQuery = sql`${withSql}select${distinctSql} ${selection} from ${tableSql}${joinsSql}${whereSql}${groupBySql}${havingSql}${orderBySql}${limitSql}${offsetSql}${lockingClauseSql}`;
    if (setOperators.length > 0) {
      return this.buildSetOperations(finalQuery, setOperators);
    }
    return finalQuery;
  }
  buildSetOperations(leftSelect, setOperators) {
    const [setOperator, ...rest] = setOperators;
    if (!setOperator) {
      throw new Error("Cannot pass undefined values to any set operator");
    }
    if (rest.length === 0) {
      return this.buildSetOperationQuery({ leftSelect, setOperator });
    }
    return this.buildSetOperations(
      this.buildSetOperationQuery({ leftSelect, setOperator }),
      rest
    );
  }
  buildSetOperationQuery({
    leftSelect,
    setOperator: { type, isAll, rightSelect, limit, orderBy, offset }
  }) {
    const leftChunk = sql`(${leftSelect.getSQL()}) `;
    const rightChunk = sql`(${rightSelect.getSQL()})`;
    let orderBySql;
    if (orderBy && orderBy.length > 0) {
      const orderByValues = [];
      for (const singleOrderBy of orderBy) {
        if (is(singleOrderBy, PgColumn)) {
          orderByValues.push(sql.identifier(singleOrderBy.name));
        } else if (is(singleOrderBy, SQL)) {
          for (let i = 0; i < singleOrderBy.queryChunks.length; i++) {
            const chunk = singleOrderBy.queryChunks[i];
            if (is(chunk, PgColumn)) {
              singleOrderBy.queryChunks[i] = sql.identifier(chunk.name);
            }
          }
          orderByValues.push(sql`${singleOrderBy}`);
        } else {
          orderByValues.push(sql`${singleOrderBy}`);
        }
      }
      orderBySql = sql` order by ${sql.join(orderByValues, sql`, `)} `;
    }
    const limitSql = typeof limit === "object" || typeof limit === "number" && limit >= 0 ? sql` limit ${limit}` : void 0;
    const operatorChunk = sql.raw(`${type} ${isAll ? "all " : ""}`);
    const offsetSql = offset ? sql` offset ${offset}` : void 0;
    return sql`${leftChunk}${operatorChunk}${rightChunk}${orderBySql}${limitSql}${offsetSql}`;
  }
  buildInsertQuery({ table, values: valuesOrSelect, onConflict, returning, withList, select, overridingSystemValue_ }) {
    const valuesSqlList = [];
    const columns = table[Table.Symbol.Columns];
    const colEntries = Object.entries(columns).filter(([_, col]) => !col.shouldDisableInsert());
    const insertOrder = colEntries.map(
      ([, column]) => sql.identifier(this.casing.getColumnCasing(column))
    );
    if (select) {
      const select2 = valuesOrSelect;
      if (is(select2, SQL)) {
        valuesSqlList.push(select2);
      } else {
        valuesSqlList.push(select2.getSQL());
      }
    } else {
      const values = valuesOrSelect;
      valuesSqlList.push(sql.raw("values "));
      for (const [valueIndex, value] of values.entries()) {
        const valueList = [];
        for (const [fieldName, col] of colEntries) {
          const colValue = value[fieldName];
          if (colValue === void 0 || is(colValue, Param) && colValue.value === void 0) {
            if (col.defaultFn !== void 0) {
              const defaultFnResult = col.defaultFn();
              const defaultValue = is(defaultFnResult, SQL) ? defaultFnResult : sql.param(defaultFnResult, col);
              valueList.push(defaultValue);
            } else if (!col.default && col.onUpdateFn !== void 0) {
              const onUpdateFnResult = col.onUpdateFn();
              const newValue = is(onUpdateFnResult, SQL) ? onUpdateFnResult : sql.param(onUpdateFnResult, col);
              valueList.push(newValue);
            } else {
              valueList.push(sql`default`);
            }
          } else {
            valueList.push(colValue);
          }
        }
        valuesSqlList.push(valueList);
        if (valueIndex < values.length - 1) {
          valuesSqlList.push(sql`, `);
        }
      }
    }
    const withSql = this.buildWithCTE(withList);
    const valuesSql = sql.join(valuesSqlList);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const onConflictSql = onConflict ? sql` on conflict ${onConflict}` : void 0;
    const overridingSql = overridingSystemValue_ === true ? sql`overriding system value ` : void 0;
    return sql`${withSql}insert into ${table} ${insertOrder} ${overridingSql}${valuesSql}${onConflictSql}${returningSql}`;
  }
  buildRefreshMaterializedViewQuery({ view, concurrently, withNoData }) {
    const concurrentlySql = concurrently ? sql` concurrently` : void 0;
    const withNoDataSql = withNoData ? sql` with no data` : void 0;
    return sql`refresh materialized view${concurrentlySql} ${view}${withNoDataSql}`;
  }
  prepareTyping(encoder) {
    if (is(encoder, PgJsonb) || is(encoder, PgJson)) {
      return "json";
    } else if (is(encoder, PgNumeric)) {
      return "decimal";
    } else if (is(encoder, PgTime)) {
      return "time";
    } else if (is(encoder, PgTimestamp) || is(encoder, PgTimestampString)) {
      return "timestamp";
    } else if (is(encoder, PgDate) || is(encoder, PgDateString)) {
      return "date";
    } else if (is(encoder, PgUUID)) {
      return "uuid";
    } else {
      return "none";
    }
  }
  sqlToQuery(sql2, invokeSource) {
    return sql2.toQuery({
      casing: this.casing,
      escapeName: this.escapeName,
      escapeParam: this.escapeParam,
      escapeString: this.escapeString,
      prepareTyping: this.prepareTyping,
      invokeSource
    });
  }
  // buildRelationalQueryWithPK({
  // 	fullSchema,
  // 	schema,
  // 	tableNamesMap,
  // 	table,
  // 	tableConfig,
  // 	queryConfig: config,
  // 	tableAlias,
  // 	isRoot = false,
  // 	joinOn,
  // }: {
  // 	fullSchema: Record<string, unknown>;
  // 	schema: TablesRelationalConfig;
  // 	tableNamesMap: Record<string, string>;
  // 	table: PgTable;
  // 	tableConfig: TableRelationalConfig;
  // 	queryConfig: true | DBQueryConfig<'many', true>;
  // 	tableAlias: string;
  // 	isRoot?: boolean;
  // 	joinOn?: SQL;
  // }): BuildRelationalQueryResult<PgTable, PgColumn> {
  // 	// For { "<relation>": true }, return a table with selection of all columns
  // 	if (config === true) {
  // 		const selectionEntries = Object.entries(tableConfig.columns);
  // 		const selection: BuildRelationalQueryResult<PgTable, PgColumn>['selection'] = selectionEntries.map((
  // 			[key, value],
  // 		) => ({
  // 			dbKey: value.name,
  // 			tsKey: key,
  // 			field: value as PgColumn,
  // 			relationTableTsKey: undefined,
  // 			isJson: false,
  // 			selection: [],
  // 		}));
  // 		return {
  // 			tableTsKey: tableConfig.tsName,
  // 			sql: table,
  // 			selection,
  // 		};
  // 	}
  // 	// let selection: BuildRelationalQueryResult<PgTable, PgColumn>['selection'] = [];
  // 	// let selectionForBuild = selection;
  // 	const aliasedColumns = Object.fromEntries(
  // 		Object.entries(tableConfig.columns).map(([key, value]) => [key, aliasedTableColumn(value, tableAlias)]),
  // 	);
  // 	const aliasedRelations = Object.fromEntries(
  // 		Object.entries(tableConfig.relations).map(([key, value]) => [key, aliasedRelation(value, tableAlias)]),
  // 	);
  // 	const aliasedFields = Object.assign({}, aliasedColumns, aliasedRelations);
  // 	let where, hasUserDefinedWhere;
  // 	if (config.where) {
  // 		const whereSql = typeof config.where === 'function' ? config.where(aliasedFields, operators) : config.where;
  // 		where = whereSql && mapColumnsInSQLToAlias(whereSql, tableAlias);
  // 		hasUserDefinedWhere = !!where;
  // 	}
  // 	where = and(joinOn, where);
  // 	// const fieldsSelection: { tsKey: string; value: PgColumn | SQL.Aliased; isExtra?: boolean }[] = [];
  // 	let joins: Join[] = [];
  // 	let selectedColumns: string[] = [];
  // 	// Figure out which columns to select
  // 	if (config.columns) {
  // 		let isIncludeMode = false;
  // 		for (const [field, value] of Object.entries(config.columns)) {
  // 			if (value === undefined) {
  // 				continue;
  // 			}
  // 			if (field in tableConfig.columns) {
  // 				if (!isIncludeMode && value === true) {
  // 					isIncludeMode = true;
  // 				}
  // 				selectedColumns.push(field);
  // 			}
  // 		}
  // 		if (selectedColumns.length > 0) {
  // 			selectedColumns = isIncludeMode
  // 				? selectedColumns.filter((c) => config.columns?.[c] === true)
  // 				: Object.keys(tableConfig.columns).filter((key) => !selectedColumns.includes(key));
  // 		}
  // 	} else {
  // 		// Select all columns if selection is not specified
  // 		selectedColumns = Object.keys(tableConfig.columns);
  // 	}
  // 	// for (const field of selectedColumns) {
  // 	// 	const column = tableConfig.columns[field]! as PgColumn;
  // 	// 	fieldsSelection.push({ tsKey: field, value: column });
  // 	// }
  // 	let initiallySelectedRelations: {
  // 		tsKey: string;
  // 		queryConfig: true | DBQueryConfig<'many', false>;
  // 		relation: Relation;
  // 	}[] = [];
  // 	// let selectedRelations: BuildRelationalQueryResult<PgTable, PgColumn>['selection'] = [];
  // 	// Figure out which relations to select
  // 	if (config.with) {
  // 		initiallySelectedRelations = Object.entries(config.with)
  // 			.filter((entry): entry is [typeof entry[0], NonNullable<typeof entry[1]>] => !!entry[1])
  // 			.map(([tsKey, queryConfig]) => ({ tsKey, queryConfig, relation: tableConfig.relations[tsKey]! }));
  // 	}
  // 	const manyRelations = initiallySelectedRelations.filter((r) =>
  // 		is(r.relation, Many)
  // 		&& (schema[tableNamesMap[r.relation.referencedTable[Table.Symbol.Name]]!]?.primaryKey.length ?? 0) > 0
  // 	);
  // 	// If this is the last Many relation (or there are no Many relations), we are on the innermost subquery level
  // 	const isInnermostQuery = manyRelations.length < 2;
  // 	const selectedExtras: {
  // 		tsKey: string;
  // 		value: SQL.Aliased;
  // 	}[] = [];
  // 	// Figure out which extras to select
  // 	if (isInnermostQuery && config.extras) {
  // 		const extras = typeof config.extras === 'function'
  // 			? config.extras(aliasedFields, { sql })
  // 			: config.extras;
  // 		for (const [tsKey, value] of Object.entries(extras)) {
  // 			selectedExtras.push({
  // 				tsKey,
  // 				value: mapColumnsInAliasedSQLToAlias(value, tableAlias),
  // 			});
  // 		}
  // 	}
  // 	// Transform `fieldsSelection` into `selection`
  // 	// `fieldsSelection` shouldn't be used after this point
  // 	// for (const { tsKey, value, isExtra } of fieldsSelection) {
  // 	// 	selection.push({
  // 	// 		dbKey: is(value, SQL.Aliased) ? value.fieldAlias : tableConfig.columns[tsKey]!.name,
  // 	// 		tsKey,
  // 	// 		field: is(value, Column) ? aliasedTableColumn(value, tableAlias) : value,
  // 	// 		relationTableTsKey: undefined,
  // 	// 		isJson: false,
  // 	// 		isExtra,
  // 	// 		selection: [],
  // 	// 	});
  // 	// }
  // 	let orderByOrig = typeof config.orderBy === 'function'
  // 		? config.orderBy(aliasedFields, orderByOperators)
  // 		: config.orderBy ?? [];
  // 	if (!Array.isArray(orderByOrig)) {
  // 		orderByOrig = [orderByOrig];
  // 	}
  // 	const orderBy = orderByOrig.map((orderByValue) => {
  // 		if (is(orderByValue, Column)) {
  // 			return aliasedTableColumn(orderByValue, tableAlias) as PgColumn;
  // 		}
  // 		return mapColumnsInSQLToAlias(orderByValue, tableAlias);
  // 	});
  // 	const limit = isInnermostQuery ? config.limit : undefined;
  // 	const offset = isInnermostQuery ? config.offset : undefined;
  // 	// For non-root queries without additional config except columns, return a table with selection
  // 	if (
  // 		!isRoot
  // 		&& initiallySelectedRelations.length === 0
  // 		&& selectedExtras.length === 0
  // 		&& !where
  // 		&& orderBy.length === 0
  // 		&& limit === undefined
  // 		&& offset === undefined
  // 	) {
  // 		return {
  // 			tableTsKey: tableConfig.tsName,
  // 			sql: table,
  // 			selection: selectedColumns.map((key) => ({
  // 				dbKey: tableConfig.columns[key]!.name,
  // 				tsKey: key,
  // 				field: tableConfig.columns[key] as PgColumn,
  // 				relationTableTsKey: undefined,
  // 				isJson: false,
  // 				selection: [],
  // 			})),
  // 		};
  // 	}
  // 	const selectedRelationsWithoutPK:
  // 	// Process all relations without primary keys, because they need to be joined differently and will all be on the same query level
  // 	for (
  // 		const {
  // 			tsKey: selectedRelationTsKey,
  // 			queryConfig: selectedRelationConfigValue,
  // 			relation,
  // 		} of initiallySelectedRelations
  // 	) {
  // 		const normalizedRelation = normalizeRelation(schema, tableNamesMap, relation);
  // 		const relationTableName = relation.referencedTable[Table.Symbol.Name];
  // 		const relationTableTsName = tableNamesMap[relationTableName]!;
  // 		const relationTable = schema[relationTableTsName]!;
  // 		if (relationTable.primaryKey.length > 0) {
  // 			continue;
  // 		}
  // 		const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
  // 		const joinOn = and(
  // 			...normalizedRelation.fields.map((field, i) =>
  // 				eq(
  // 					aliasedTableColumn(normalizedRelation.references[i]!, relationTableAlias),
  // 					aliasedTableColumn(field, tableAlias),
  // 				)
  // 			),
  // 		);
  // 		const builtRelation = this.buildRelationalQueryWithoutPK({
  // 			fullSchema,
  // 			schema,
  // 			tableNamesMap,
  // 			table: fullSchema[relationTableTsName] as PgTable,
  // 			tableConfig: schema[relationTableTsName]!,
  // 			queryConfig: selectedRelationConfigValue,
  // 			tableAlias: relationTableAlias,
  // 			joinOn,
  // 			nestedQueryRelation: relation,
  // 		});
  // 		const field = sql`${sql.identifier(relationTableAlias)}.${sql.identifier('data')}`.as(selectedRelationTsKey);
  // 		joins.push({
  // 			on: sql`true`,
  // 			table: new Subquery(builtRelation.sql as SQL, {}, relationTableAlias),
  // 			alias: relationTableAlias,
  // 			joinType: 'left',
  // 			lateral: true,
  // 		});
  // 		selectedRelations.push({
  // 			dbKey: selectedRelationTsKey,
  // 			tsKey: selectedRelationTsKey,
  // 			field,
  // 			relationTableTsKey: relationTableTsName,
  // 			isJson: true,
  // 			selection: builtRelation.selection,
  // 		});
  // 	}
  // 	const oneRelations = initiallySelectedRelations.filter((r): r is typeof r & { relation: One } =>
  // 		is(r.relation, One)
  // 	);
  // 	// Process all One relations with PKs, because they can all be joined on the same level
  // 	for (
  // 		const {
  // 			tsKey: selectedRelationTsKey,
  // 			queryConfig: selectedRelationConfigValue,
  // 			relation,
  // 		} of oneRelations
  // 	) {
  // 		const normalizedRelation = normalizeRelation(schema, tableNamesMap, relation);
  // 		const relationTableName = relation.referencedTable[Table.Symbol.Name];
  // 		const relationTableTsName = tableNamesMap[relationTableName]!;
  // 		const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
  // 		const relationTable = schema[relationTableTsName]!;
  // 		if (relationTable.primaryKey.length === 0) {
  // 			continue;
  // 		}
  // 		const joinOn = and(
  // 			...normalizedRelation.fields.map((field, i) =>
  // 				eq(
  // 					aliasedTableColumn(normalizedRelation.references[i]!, relationTableAlias),
  // 					aliasedTableColumn(field, tableAlias),
  // 				)
  // 			),
  // 		);
  // 		const builtRelation = this.buildRelationalQueryWithPK({
  // 			fullSchema,
  // 			schema,
  // 			tableNamesMap,
  // 			table: fullSchema[relationTableTsName] as PgTable,
  // 			tableConfig: schema[relationTableTsName]!,
  // 			queryConfig: selectedRelationConfigValue,
  // 			tableAlias: relationTableAlias,
  // 			joinOn,
  // 		});
  // 		const field = sql`case when ${sql.identifier(relationTableAlias)} is null then null else json_build_array(${
  // 			sql.join(
  // 				builtRelation.selection.map(({ field }) =>
  // 					is(field, SQL.Aliased)
  // 						? sql`${sql.identifier(relationTableAlias)}.${sql.identifier(field.fieldAlias)}`
  // 						: is(field, Column)
  // 						? aliasedTableColumn(field, relationTableAlias)
  // 						: field
  // 				),
  // 				sql`, `,
  // 			)
  // 		}) end`.as(selectedRelationTsKey);
  // 		const isLateralJoin = is(builtRelation.sql, SQL);
  // 		joins.push({
  // 			on: isLateralJoin ? sql`true` : joinOn,
  // 			table: is(builtRelation.sql, SQL)
  // 				? new Subquery(builtRelation.sql, {}, relationTableAlias)
  // 				: aliasedTable(builtRelation.sql, relationTableAlias),
  // 			alias: relationTableAlias,
  // 			joinType: 'left',
  // 			lateral: is(builtRelation.sql, SQL),
  // 		});
  // 		selectedRelations.push({
  // 			dbKey: selectedRelationTsKey,
  // 			tsKey: selectedRelationTsKey,
  // 			field,
  // 			relationTableTsKey: relationTableTsName,
  // 			isJson: true,
  // 			selection: builtRelation.selection,
  // 		});
  // 	}
  // 	let distinct: PgSelectConfig['distinct'];
  // 	let tableFrom: PgTable | Subquery = table;
  // 	// Process first Many relation - each one requires a nested subquery
  // 	const manyRelation = manyRelations[0];
  // 	if (manyRelation) {
  // 		const {
  // 			tsKey: selectedRelationTsKey,
  // 			queryConfig: selectedRelationQueryConfig,
  // 			relation,
  // 		} = manyRelation;
  // 		distinct = {
  // 			on: tableConfig.primaryKey.map((c) => aliasedTableColumn(c as PgColumn, tableAlias)),
  // 		};
  // 		const normalizedRelation = normalizeRelation(schema, tableNamesMap, relation);
  // 		const relationTableName = relation.referencedTable[Table.Symbol.Name];
  // 		const relationTableTsName = tableNamesMap[relationTableName]!;
  // 		const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
  // 		const joinOn = and(
  // 			...normalizedRelation.fields.map((field, i) =>
  // 				eq(
  // 					aliasedTableColumn(normalizedRelation.references[i]!, relationTableAlias),
  // 					aliasedTableColumn(field, tableAlias),
  // 				)
  // 			),
  // 		);
  // 		const builtRelationJoin = this.buildRelationalQueryWithPK({
  // 			fullSchema,
  // 			schema,
  // 			tableNamesMap,
  // 			table: fullSchema[relationTableTsName] as PgTable,
  // 			tableConfig: schema[relationTableTsName]!,
  // 			queryConfig: selectedRelationQueryConfig,
  // 			tableAlias: relationTableAlias,
  // 			joinOn,
  // 		});
  // 		const builtRelationSelectionField = sql`case when ${
  // 			sql.identifier(relationTableAlias)
  // 		} is null then '[]' else json_agg(json_build_array(${
  // 			sql.join(
  // 				builtRelationJoin.selection.map(({ field }) =>
  // 					is(field, SQL.Aliased)
  // 						? sql`${sql.identifier(relationTableAlias)}.${sql.identifier(field.fieldAlias)}`
  // 						: is(field, Column)
  // 						? aliasedTableColumn(field, relationTableAlias)
  // 						: field
  // 				),
  // 				sql`, `,
  // 			)
  // 		})) over (partition by ${sql.join(distinct.on, sql`, `)}) end`.as(selectedRelationTsKey);
  // 		const isLateralJoin = is(builtRelationJoin.sql, SQL);
  // 		joins.push({
  // 			on: isLateralJoin ? sql`true` : joinOn,
  // 			table: isLateralJoin
  // 				? new Subquery(builtRelationJoin.sql as SQL, {}, relationTableAlias)
  // 				: aliasedTable(builtRelationJoin.sql as PgTable, relationTableAlias),
  // 			alias: relationTableAlias,
  // 			joinType: 'left',
  // 			lateral: isLateralJoin,
  // 		});
  // 		// Build the "from" subquery with the remaining Many relations
  // 		const builtTableFrom = this.buildRelationalQueryWithPK({
  // 			fullSchema,
  // 			schema,
  // 			tableNamesMap,
  // 			table,
  // 			tableConfig,
  // 			queryConfig: {
  // 				...config,
  // 				where: undefined,
  // 				orderBy: undefined,
  // 				limit: undefined,
  // 				offset: undefined,
  // 				with: manyRelations.slice(1).reduce<NonNullable<typeof config['with']>>(
  // 					(result, { tsKey, queryConfig: configValue }) => {
  // 						result[tsKey] = configValue;
  // 						return result;
  // 					},
  // 					{},
  // 				),
  // 			},
  // 			tableAlias,
  // 		});
  // 		selectedRelations.push({
  // 			dbKey: selectedRelationTsKey,
  // 			tsKey: selectedRelationTsKey,
  // 			field: builtRelationSelectionField,
  // 			relationTableTsKey: relationTableTsName,
  // 			isJson: true,
  // 			selection: builtRelationJoin.selection,
  // 		});
  // 		// selection = builtTableFrom.selection.map((item) =>
  // 		// 	is(item.field, SQL.Aliased)
  // 		// 		? { ...item, field: sql`${sql.identifier(tableAlias)}.${sql.identifier(item.field.fieldAlias)}` }
  // 		// 		: item
  // 		// );
  // 		// selectionForBuild = [{
  // 		// 	dbKey: '*',
  // 		// 	tsKey: '*',
  // 		// 	field: sql`${sql.identifier(tableAlias)}.*`,
  // 		// 	selection: [],
  // 		// 	isJson: false,
  // 		// 	relationTableTsKey: undefined,
  // 		// }];
  // 		// const newSelectionItem: (typeof selection)[number] = {
  // 		// 	dbKey: selectedRelationTsKey,
  // 		// 	tsKey: selectedRelationTsKey,
  // 		// 	field,
  // 		// 	relationTableTsKey: relationTableTsName,
  // 		// 	isJson: true,
  // 		// 	selection: builtRelationJoin.selection,
  // 		// };
  // 		// selection.push(newSelectionItem);
  // 		// selectionForBuild.push(newSelectionItem);
  // 		tableFrom = is(builtTableFrom.sql, PgTable)
  // 			? builtTableFrom.sql
  // 			: new Subquery(builtTableFrom.sql, {}, tableAlias);
  // 	}
  // 	if (selectedColumns.length === 0 && selectedRelations.length === 0 && selectedExtras.length === 0) {
  // 		throw new DrizzleError(`No fields selected for table "${tableConfig.tsName}" ("${tableAlias}")`);
  // 	}
  // 	let selection: BuildRelationalQueryResult<PgTable, PgColumn>['selection'];
  // 	function prepareSelectedColumns() {
  // 		return selectedColumns.map((key) => ({
  // 			dbKey: tableConfig.columns[key]!.name,
  // 			tsKey: key,
  // 			field: tableConfig.columns[key] as PgColumn,
  // 			relationTableTsKey: undefined,
  // 			isJson: false,
  // 			selection: [],
  // 		}));
  // 	}
  // 	function prepareSelectedExtras() {
  // 		return selectedExtras.map((item) => ({
  // 			dbKey: item.value.fieldAlias,
  // 			tsKey: item.tsKey,
  // 			field: item.value,
  // 			relationTableTsKey: undefined,
  // 			isJson: false,
  // 			selection: [],
  // 		}));
  // 	}
  // 	if (isRoot) {
  // 		selection = [
  // 			...prepareSelectedColumns(),
  // 			...prepareSelectedExtras(),
  // 		];
  // 	}
  // 	if (hasUserDefinedWhere || orderBy.length > 0) {
  // 		tableFrom = new Subquery(
  // 			this.buildSelectQuery({
  // 				table: is(tableFrom, PgTable) ? aliasedTable(tableFrom, tableAlias) : tableFrom,
  // 				fields: {},
  // 				fieldsFlat: selectionForBuild.map(({ field }) => ({
  // 					path: [],
  // 					field: is(field, Column) ? aliasedTableColumn(field, tableAlias) : field,
  // 				})),
  // 				joins,
  // 				distinct,
  // 			}),
  // 			{},
  // 			tableAlias,
  // 		);
  // 		selectionForBuild = selection.map((item) =>
  // 			is(item.field, SQL.Aliased)
  // 				? { ...item, field: sql`${sql.identifier(tableAlias)}.${sql.identifier(item.field.fieldAlias)}` }
  // 				: item
  // 		);
  // 		joins = [];
  // 		distinct = undefined;
  // 	}
  // 	const result = this.buildSelectQuery({
  // 		table: is(tableFrom, PgTable) ? aliasedTable(tableFrom, tableAlias) : tableFrom,
  // 		fields: {},
  // 		fieldsFlat: selectionForBuild.map(({ field }) => ({
  // 			path: [],
  // 			field: is(field, Column) ? aliasedTableColumn(field, tableAlias) : field,
  // 		})),
  // 		where,
  // 		limit,
  // 		offset,
  // 		joins,
  // 		orderBy,
  // 		distinct,
  // 	});
  // 	return {
  // 		tableTsKey: tableConfig.tsName,
  // 		sql: result,
  // 		selection,
  // 	};
  // }
  buildRelationalQueryWithoutPK({
    fullSchema,
    schema,
    tableNamesMap,
    table,
    tableConfig,
    queryConfig: config,
    tableAlias,
    nestedQueryRelation,
    joinOn
  }) {
    let selection = [];
    let limit, offset, orderBy = [], where;
    const joins = [];
    if (config === true) {
      const selectionEntries = Object.entries(tableConfig.columns);
      selection = selectionEntries.map(([key, value]) => ({
        dbKey: value.name,
        tsKey: key,
        field: aliasedTableColumn(value, tableAlias),
        relationTableTsKey: void 0,
        isJson: false,
        selection: []
      }));
    } else {
      const aliasedColumns = Object.fromEntries(
        Object.entries(tableConfig.columns).map(([key, value]) => [key, aliasedTableColumn(value, tableAlias)])
      );
      if (config.where) {
        const whereSql = typeof config.where === "function" ? config.where(aliasedColumns, getOperators()) : config.where;
        where = whereSql && mapColumnsInSQLToAlias(whereSql, tableAlias);
      }
      const fieldsSelection = [];
      let selectedColumns = [];
      if (config.columns) {
        let isIncludeMode = false;
        for (const [field, value] of Object.entries(config.columns)) {
          if (value === void 0) {
            continue;
          }
          if (field in tableConfig.columns) {
            if (!isIncludeMode && value === true) {
              isIncludeMode = true;
            }
            selectedColumns.push(field);
          }
        }
        if (selectedColumns.length > 0) {
          selectedColumns = isIncludeMode ? selectedColumns.filter((c) => config.columns?.[c] === true) : Object.keys(tableConfig.columns).filter((key) => !selectedColumns.includes(key));
        }
      } else {
        selectedColumns = Object.keys(tableConfig.columns);
      }
      for (const field of selectedColumns) {
        const column = tableConfig.columns[field];
        fieldsSelection.push({ tsKey: field, value: column });
      }
      let selectedRelations = [];
      if (config.with) {
        selectedRelations = Object.entries(config.with).filter((entry) => !!entry[1]).map(([tsKey, queryConfig]) => ({ tsKey, queryConfig, relation: tableConfig.relations[tsKey] }));
      }
      let extras;
      if (config.extras) {
        extras = typeof config.extras === "function" ? config.extras(aliasedColumns, { sql }) : config.extras;
        for (const [tsKey, value] of Object.entries(extras)) {
          fieldsSelection.push({
            tsKey,
            value: mapColumnsInAliasedSQLToAlias(value, tableAlias)
          });
        }
      }
      for (const { tsKey, value } of fieldsSelection) {
        selection.push({
          dbKey: is(value, SQL.Aliased) ? value.fieldAlias : tableConfig.columns[tsKey].name,
          tsKey,
          field: is(value, Column) ? aliasedTableColumn(value, tableAlias) : value,
          relationTableTsKey: void 0,
          isJson: false,
          selection: []
        });
      }
      let orderByOrig = typeof config.orderBy === "function" ? config.orderBy(aliasedColumns, getOrderByOperators()) : config.orderBy ?? [];
      if (!Array.isArray(orderByOrig)) {
        orderByOrig = [orderByOrig];
      }
      orderBy = orderByOrig.map((orderByValue) => {
        if (is(orderByValue, Column)) {
          return aliasedTableColumn(orderByValue, tableAlias);
        }
        return mapColumnsInSQLToAlias(orderByValue, tableAlias);
      });
      limit = config.limit;
      offset = config.offset;
      for (const {
        tsKey: selectedRelationTsKey,
        queryConfig: selectedRelationConfigValue,
        relation
      } of selectedRelations) {
        const normalizedRelation = normalizeRelation(schema, tableNamesMap, relation);
        const relationTableName = getTableUniqueName(relation.referencedTable);
        const relationTableTsName = tableNamesMap[relationTableName];
        const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
        const joinOn2 = and(
          ...normalizedRelation.fields.map(
            (field2, i) => eq(
              aliasedTableColumn(normalizedRelation.references[i], relationTableAlias),
              aliasedTableColumn(field2, tableAlias)
            )
          )
        );
        const builtRelation = this.buildRelationalQueryWithoutPK({
          fullSchema,
          schema,
          tableNamesMap,
          table: fullSchema[relationTableTsName],
          tableConfig: schema[relationTableTsName],
          queryConfig: is(relation, One) ? selectedRelationConfigValue === true ? { limit: 1 } : { ...selectedRelationConfigValue, limit: 1 } : selectedRelationConfigValue,
          tableAlias: relationTableAlias,
          joinOn: joinOn2,
          nestedQueryRelation: relation
        });
        const field = sql`${sql.identifier(relationTableAlias)}.${sql.identifier("data")}`.as(selectedRelationTsKey);
        joins.push({
          on: sql`true`,
          table: new Subquery(builtRelation.sql, {}, relationTableAlias),
          alias: relationTableAlias,
          joinType: "left",
          lateral: true
        });
        selection.push({
          dbKey: selectedRelationTsKey,
          tsKey: selectedRelationTsKey,
          field,
          relationTableTsKey: relationTableTsName,
          isJson: true,
          selection: builtRelation.selection
        });
      }
    }
    if (selection.length === 0) {
      throw new DrizzleError({ message: `No fields selected for table "${tableConfig.tsName}" ("${tableAlias}")` });
    }
    let result;
    where = and(joinOn, where);
    if (nestedQueryRelation) {
      let field = sql`json_build_array(${sql.join(
        selection.map(
          ({ field: field2, tsKey, isJson }) => isJson ? sql`${sql.identifier(`${tableAlias}_${tsKey}`)}.${sql.identifier("data")}` : is(field2, SQL.Aliased) ? field2.sql : field2
        ),
        sql`, `
      )})`;
      if (is(nestedQueryRelation, Many)) {
        field = sql`coalesce(json_agg(${field}${orderBy.length > 0 ? sql` order by ${sql.join(orderBy, sql`, `)}` : void 0}), '[]'::json)`;
      }
      const nestedSelection = [{
        dbKey: "data",
        tsKey: "data",
        field: field.as("data"),
        isJson: true,
        relationTableTsKey: tableConfig.tsName,
        selection
      }];
      const needsSubquery = limit !== void 0 || offset !== void 0 || orderBy.length > 0;
      if (needsSubquery) {
        result = this.buildSelectQuery({
          table: aliasedTable(table, tableAlias),
          fields: {},
          fieldsFlat: [{
            path: [],
            field: sql.raw("*")
          }],
          where,
          limit,
          offset,
          orderBy,
          setOperators: []
        });
        where = void 0;
        limit = void 0;
        offset = void 0;
        orderBy = [];
      } else {
        result = aliasedTable(table, tableAlias);
      }
      result = this.buildSelectQuery({
        table: is(result, PgTable) ? result : new Subquery(result, {}, tableAlias),
        fields: {},
        fieldsFlat: nestedSelection.map(({ field: field2 }) => ({
          path: [],
          field: is(field2, Column) ? aliasedTableColumn(field2, tableAlias) : field2
        })),
        joins,
        where,
        limit,
        offset,
        orderBy,
        setOperators: []
      });
    } else {
      result = this.buildSelectQuery({
        table: aliasedTable(table, tableAlias),
        fields: {},
        fieldsFlat: selection.map(({ field }) => ({
          path: [],
          field: is(field, Column) ? aliasedTableColumn(field, tableAlias) : field
        })),
        joins,
        where,
        limit,
        offset,
        orderBy,
        setOperators: []
      });
    }
    return {
      tableTsKey: tableConfig.tsName,
      sql: result,
      selection
    };
  }
};

// ../../node_modules/drizzle-orm/query-builders/query-builder.js
var TypedQueryBuilder = class {
  static [entityKind] = "TypedQueryBuilder";
  /** @internal */
  getSelectedFields() {
    return this._.selectedFields;
  }
};

// ../../node_modules/drizzle-orm/pg-core/query-builders/select.js
var PgSelectBuilder = class {
  static [entityKind] = "PgSelectBuilder";
  fields;
  session;
  dialect;
  withList = [];
  distinct;
  constructor(config) {
    this.fields = config.fields;
    this.session = config.session;
    this.dialect = config.dialect;
    if (config.withList) {
      this.withList = config.withList;
    }
    this.distinct = config.distinct;
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  /**
   * Specify the table, subquery, or other target that you're
   * building a select query against.
   *
   * {@link https://www.postgresql.org/docs/current/sql-select.html#SQL-FROM | Postgres from documentation}
   */
  from(source) {
    const isPartialSelect = !!this.fields;
    const src = source;
    let fields;
    if (this.fields) {
      fields = this.fields;
    } else if (is(src, Subquery)) {
      fields = Object.fromEntries(
        Object.keys(src._.selectedFields).map((key) => [key, src[key]])
      );
    } else if (is(src, PgViewBase)) {
      fields = src[ViewBaseConfig].selectedFields;
    } else if (is(src, SQL)) {
      fields = {};
    } else {
      fields = getTableColumns(src);
    }
    return new PgSelectBase({
      table: src,
      fields,
      isPartialSelect,
      session: this.session,
      dialect: this.dialect,
      withList: this.withList,
      distinct: this.distinct
    }).setToken(this.authToken);
  }
};
var PgSelectQueryBuilderBase = class extends TypedQueryBuilder {
  static [entityKind] = "PgSelectQueryBuilder";
  _;
  config;
  joinsNotNullableMap;
  tableName;
  isPartialSelect;
  session;
  dialect;
  cacheConfig = void 0;
  usedTables = /* @__PURE__ */ new Set();
  constructor({ table, fields, isPartialSelect, session, dialect, withList, distinct }) {
    super();
    this.config = {
      withList,
      table,
      fields: { ...fields },
      distinct,
      setOperators: []
    };
    this.isPartialSelect = isPartialSelect;
    this.session = session;
    this.dialect = dialect;
    this._ = {
      selectedFields: fields,
      config: this.config
    };
    this.tableName = getTableLikeName(table);
    this.joinsNotNullableMap = typeof this.tableName === "string" ? { [this.tableName]: true } : {};
    for (const item of extractUsedTable(table)) this.usedTables.add(item);
  }
  /** @internal */
  getUsedTables() {
    return [...this.usedTables];
  }
  createJoin(joinType, lateral) {
    return (table, on) => {
      const baseTableName = this.tableName;
      const tableName = getTableLikeName(table);
      for (const item of extractUsedTable(table)) this.usedTables.add(item);
      if (typeof tableName === "string" && this.config.joins?.some((join) => join.alias === tableName)) {
        throw new Error(`Alias "${tableName}" is already used in this query`);
      }
      if (!this.isPartialSelect) {
        if (Object.keys(this.joinsNotNullableMap).length === 1 && typeof baseTableName === "string") {
          this.config.fields = {
            [baseTableName]: this.config.fields
          };
        }
        if (typeof tableName === "string" && !is(table, SQL)) {
          const selection = is(table, Subquery) ? table._.selectedFields : is(table, View) ? table[ViewBaseConfig].selectedFields : table[Table.Symbol.Columns];
          this.config.fields[tableName] = selection;
        }
      }
      if (typeof on === "function") {
        on = on(
          new Proxy(
            this.config.fields,
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          )
        );
      }
      if (!this.config.joins) {
        this.config.joins = [];
      }
      this.config.joins.push({ on, table, joinType, alias: tableName, lateral });
      if (typeof tableName === "string") {
        switch (joinType) {
          case "left": {
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
          case "right": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "cross":
          case "inner": {
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "full": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
        }
      }
      return this;
    };
  }
  /**
   * Executes a `left join` operation by adding another table to the current query.
   *
   * Calling this method associates each row of the table with the corresponding row from the joined table, if a match is found. If no matching row exists, it sets all columns of the joined table to null.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#left-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User; pets: Pet | null; }[] = await db.select()
   *   .from(users)
   *   .leftJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number | null; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .leftJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  leftJoin = this.createJoin("left", false);
  /**
   * Executes a `left join lateral` operation by adding subquery to the current query.
   *
   * A `lateral` join allows the right-hand expression to refer to columns from the left-hand side.
   *
   * Calling this method associates each row of the table with the corresponding row from the joined table, if a match is found. If no matching row exists, it sets all columns of the joined table to null.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#left-join-lateral}
   *
   * @param table the subquery to join.
   * @param on the `on` clause.
   */
  leftJoinLateral = this.createJoin("left", true);
  /**
   * Executes a `right join` operation by adding another table to the current query.
   *
   * Calling this method associates each row of the joined table with the corresponding row from the main table, if a match is found. If no matching row exists, it sets all columns of the main table to null.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#right-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User | null; pets: Pet; }[] = await db.select()
   *   .from(users)
   *   .rightJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number | null; petId: number; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .rightJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  rightJoin = this.createJoin("right", false);
  /**
   * Executes an `inner join` operation, creating a new table by combining rows from two tables that have matching values.
   *
   * Calling this method retrieves rows that have corresponding entries in both joined tables. Rows without matching entries in either table are excluded, resulting in a table that includes only matching pairs.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#inner-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User; pets: Pet; }[] = await db.select()
   *   .from(users)
   *   .innerJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .innerJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  innerJoin = this.createJoin("inner", false);
  /**
   * Executes an `inner join lateral` operation, creating a new table by combining rows from two queries that have matching values.
   *
   * A `lateral` join allows the right-hand expression to refer to columns from the left-hand side.
   *
   * Calling this method retrieves rows that have corresponding entries in both joined tables. Rows without matching entries in either table are excluded, resulting in a table that includes only matching pairs.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#inner-join-lateral}
   *
   * @param table the subquery to join.
   * @param on the `on` clause.
   */
  innerJoinLateral = this.createJoin("inner", true);
  /**
   * Executes a `full join` operation by combining rows from two tables into a new table.
   *
   * Calling this method retrieves all rows from both main and joined tables, merging rows with matching values and filling in `null` for non-matching columns.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#full-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User | null; pets: Pet | null; }[] = await db.select()
   *   .from(users)
   *   .fullJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number | null; petId: number | null; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .fullJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  fullJoin = this.createJoin("full", false);
  /**
   * Executes a `cross join` operation by combining rows from two tables into a new table.
   *
   * Calling this method retrieves all rows from both main and joined tables, merging all rows from each table.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#cross-join}
   *
   * @param table the table to join.
   *
   * @example
   *
   * ```ts
   * // Select all users, each user with every pet
   * const usersWithPets: { user: User; pets: Pet; }[] = await db.select()
   *   .from(users)
   *   .crossJoin(pets)
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .crossJoin(pets)
   * ```
   */
  crossJoin = this.createJoin("cross", false);
  /**
   * Executes a `cross join lateral` operation by combining rows from two queries into a new table.
   *
   * A `lateral` join allows the right-hand expression to refer to columns from the left-hand side.
   *
   * Calling this method retrieves all rows from both main and joined queries, merging all rows from each query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#cross-join-lateral}
   *
   * @param table the query to join.
   */
  crossJoinLateral = this.createJoin("cross", true);
  createSetOperator(type, isAll) {
    return (rightSelection) => {
      const rightSelect = typeof rightSelection === "function" ? rightSelection(getPgSetOperators()) : rightSelection;
      if (!haveSameKeys(this.getSelectedFields(), rightSelect.getSelectedFields())) {
        throw new Error(
          "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
        );
      }
      this.config.setOperators.push({ type, isAll, rightSelect });
      return this;
    };
  }
  /**
   * Adds `union` set operator to the query.
   *
   * Calling this method will combine the result sets of the `select` statements and remove any duplicate rows that appear across them.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#union}
   *
   * @example
   *
   * ```ts
   * // Select all unique names from customers and users tables
   * await db.select({ name: users.name })
   *   .from(users)
   *   .union(
   *     db.select({ name: customers.name }).from(customers)
   *   );
   * // or
   * import { union } from 'drizzle-orm/pg-core'
   *
   * await union(
   *   db.select({ name: users.name }).from(users),
   *   db.select({ name: customers.name }).from(customers)
   * );
   * ```
   */
  union = this.createSetOperator("union", false);
  /**
   * Adds `union all` set operator to the query.
   *
   * Calling this method will combine the result-set of the `select` statements and keep all duplicate rows that appear across them.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#union-all}
   *
   * @example
   *
   * ```ts
   * // Select all transaction ids from both online and in-store sales
   * await db.select({ transaction: onlineSales.transactionId })
   *   .from(onlineSales)
   *   .unionAll(
   *     db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
   *   );
   * // or
   * import { unionAll } from 'drizzle-orm/pg-core'
   *
   * await unionAll(
   *   db.select({ transaction: onlineSales.transactionId }).from(onlineSales),
   *   db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
   * );
   * ```
   */
  unionAll = this.createSetOperator("union", true);
  /**
   * Adds `intersect` set operator to the query.
   *
   * Calling this method will retain only the rows that are present in both result sets and eliminate duplicates.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#intersect}
   *
   * @example
   *
   * ```ts
   * // Select course names that are offered in both departments A and B
   * await db.select({ courseName: depA.courseName })
   *   .from(depA)
   *   .intersect(
   *     db.select({ courseName: depB.courseName }).from(depB)
   *   );
   * // or
   * import { intersect } from 'drizzle-orm/pg-core'
   *
   * await intersect(
   *   db.select({ courseName: depA.courseName }).from(depA),
   *   db.select({ courseName: depB.courseName }).from(depB)
   * );
   * ```
   */
  intersect = this.createSetOperator("intersect", false);
  /**
   * Adds `intersect all` set operator to the query.
   *
   * Calling this method will retain only the rows that are present in both result sets including all duplicates.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#intersect-all}
   *
   * @example
   *
   * ```ts
   * // Select all products and quantities that are ordered by both regular and VIP customers
   * await db.select({
   *   productId: regularCustomerOrders.productId,
   *   quantityOrdered: regularCustomerOrders.quantityOrdered
   * })
   * .from(regularCustomerOrders)
   * .intersectAll(
   *   db.select({
   *     productId: vipCustomerOrders.productId,
   *     quantityOrdered: vipCustomerOrders.quantityOrdered
   *   })
   *   .from(vipCustomerOrders)
   * );
   * // or
   * import { intersectAll } from 'drizzle-orm/pg-core'
   *
   * await intersectAll(
   *   db.select({
   *     productId: regularCustomerOrders.productId,
   *     quantityOrdered: regularCustomerOrders.quantityOrdered
   *   })
   *   .from(regularCustomerOrders),
   *   db.select({
   *     productId: vipCustomerOrders.productId,
   *     quantityOrdered: vipCustomerOrders.quantityOrdered
   *   })
   *   .from(vipCustomerOrders)
   * );
   * ```
   */
  intersectAll = this.createSetOperator("intersect", true);
  /**
   * Adds `except` set operator to the query.
   *
   * Calling this method will retrieve all unique rows from the left query, except for the rows that are present in the result set of the right query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#except}
   *
   * @example
   *
   * ```ts
   * // Select all courses offered in department A but not in department B
   * await db.select({ courseName: depA.courseName })
   *   .from(depA)
   *   .except(
   *     db.select({ courseName: depB.courseName }).from(depB)
   *   );
   * // or
   * import { except } from 'drizzle-orm/pg-core'
   *
   * await except(
   *   db.select({ courseName: depA.courseName }).from(depA),
   *   db.select({ courseName: depB.courseName }).from(depB)
   * );
   * ```
   */
  except = this.createSetOperator("except", false);
  /**
   * Adds `except all` set operator to the query.
   *
   * Calling this method will retrieve all rows from the left query, except for the rows that are present in the result set of the right query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#except-all}
   *
   * @example
   *
   * ```ts
   * // Select all products that are ordered by regular customers but not by VIP customers
   * await db.select({
   *   productId: regularCustomerOrders.productId,
   *   quantityOrdered: regularCustomerOrders.quantityOrdered,
   * })
   * .from(regularCustomerOrders)
   * .exceptAll(
   *   db.select({
   *     productId: vipCustomerOrders.productId,
   *     quantityOrdered: vipCustomerOrders.quantityOrdered,
   *   })
   *   .from(vipCustomerOrders)
   * );
   * // or
   * import { exceptAll } from 'drizzle-orm/pg-core'
   *
   * await exceptAll(
   *   db.select({
   *     productId: regularCustomerOrders.productId,
   *     quantityOrdered: regularCustomerOrders.quantityOrdered
   *   })
   *   .from(regularCustomerOrders),
   *   db.select({
   *     productId: vipCustomerOrders.productId,
   *     quantityOrdered: vipCustomerOrders.quantityOrdered
   *   })
   *   .from(vipCustomerOrders)
   * );
   * ```
   */
  exceptAll = this.createSetOperator("except", true);
  /** @internal */
  addSetOperators(setOperators) {
    this.config.setOperators.push(...setOperators);
    return this;
  }
  /**
   * Adds a `where` clause to the query.
   *
   * Calling this method will select only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#filtering}
   *
   * @param where the `where` clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be selected.
   *
   * ```ts
   * // Select all cars with green color
   * await db.select().from(cars).where(eq(cars.color, 'green'));
   * // or
   * await db.select().from(cars).where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Select all BMW cars with a green color
   * await db.select().from(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Select all cars with the green or blue color
   * await db.select().from(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    if (typeof where === "function") {
      where = where(
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
        )
      );
    }
    this.config.where = where;
    return this;
  }
  /**
   * Adds a `having` clause to the query.
   *
   * Calling this method will select only those rows that fulfill a specified condition. It is typically used with aggregate functions to filter the aggregated data based on a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#aggregations}
   *
   * @param having the `having` clause.
   *
   * @example
   *
   * ```ts
   * // Select all brands with more than one car
   * await db.select({
   * 	brand: cars.brand,
   * 	count: sql<number>`cast(count(${cars.id}) as int)`,
   * })
   *   .from(cars)
   *   .groupBy(cars.brand)
   *   .having(({ count }) => gt(count, 1));
   * ```
   */
  having(having) {
    if (typeof having === "function") {
      having = having(
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
        )
      );
    }
    this.config.having = having;
    return this;
  }
  groupBy(...columns) {
    if (typeof columns[0] === "function") {
      const groupBy = columns[0](
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      this.config.groupBy = Array.isArray(groupBy) ? groupBy : [groupBy];
    } else {
      this.config.groupBy = columns;
    }
    return this;
  }
  orderBy(...columns) {
    if (typeof columns[0] === "function") {
      const orderBy = columns[0](
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
      if (this.config.setOperators.length > 0) {
        this.config.setOperators.at(-1).orderBy = orderByArray;
      } else {
        this.config.orderBy = orderByArray;
      }
    } else {
      const orderByArray = columns;
      if (this.config.setOperators.length > 0) {
        this.config.setOperators.at(-1).orderBy = orderByArray;
      } else {
        this.config.orderBy = orderByArray;
      }
    }
    return this;
  }
  /**
   * Adds a `limit` clause to the query.
   *
   * Calling this method will set the maximum number of rows that will be returned by this query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
   *
   * @param limit the `limit` clause.
   *
   * @example
   *
   * ```ts
   * // Get the first 10 people from this query.
   * await db.select().from(people).limit(10);
   * ```
   */
  limit(limit) {
    if (this.config.setOperators.length > 0) {
      this.config.setOperators.at(-1).limit = limit;
    } else {
      this.config.limit = limit;
    }
    return this;
  }
  /**
   * Adds an `offset` clause to the query.
   *
   * Calling this method will skip a number of rows when returning results from this query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
   *
   * @param offset the `offset` clause.
   *
   * @example
   *
   * ```ts
   * // Get the 10th-20th people from this query.
   * await db.select().from(people).offset(10).limit(10);
   * ```
   */
  offset(offset) {
    if (this.config.setOperators.length > 0) {
      this.config.setOperators.at(-1).offset = offset;
    } else {
      this.config.offset = offset;
    }
    return this;
  }
  /**
   * Adds a `for` clause to the query.
   *
   * Calling this method will specify a lock strength for this query that controls how strictly it acquires exclusive access to the rows being queried.
   *
   * See docs: {@link https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE}
   *
   * @param strength the lock strength.
   * @param config the lock configuration.
   */
  for(strength, config = {}) {
    this.config.lockingClause = { strength, config };
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildSelectQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  as(alias) {
    const usedTables = [];
    usedTables.push(...extractUsedTable(this.config.table));
    if (this.config.joins) {
      for (const it of this.config.joins) usedTables.push(...extractUsedTable(it.table));
    }
    return new Proxy(
      new Subquery(this.getSQL(), this.config.fields, alias, false, [...new Set(usedTables)]),
      new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
    );
  }
  /** @internal */
  getSelectedFields() {
    return new Proxy(
      this.config.fields,
      new SelectionProxyHandler({ alias: this.tableName, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
    );
  }
  $dynamic() {
    return this;
  }
  $withCache(config) {
    this.cacheConfig = config === void 0 ? { config: {}, enable: true, autoInvalidate: true } : config === false ? { enable: false } : { enable: true, autoInvalidate: true, ...config };
    return this;
  }
};
var PgSelectBase = class extends PgSelectQueryBuilderBase {
  static [entityKind] = "PgSelect";
  /** @internal */
  _prepare(name) {
    const { session, config, dialect, joinsNotNullableMap, authToken, cacheConfig, usedTables } = this;
    if (!session) {
      throw new Error("Cannot execute a query on a query builder. Please use a database instance instead.");
    }
    const { fields } = config;
    return tracer.startActiveSpan("drizzle.prepareQuery", () => {
      const fieldsList = orderSelectedFields(fields);
      const query = session.prepareQuery(dialect.sqlToQuery(this.getSQL()), fieldsList, name, true, void 0, {
        type: "select",
        tables: [...usedTables]
      }, cacheConfig);
      query.joinsNotNullableMap = joinsNotNullableMap;
      return query.setToken(authToken);
    });
  }
  /**
   * Create a prepared statement for this query. This allows
   * the database to remember this query for the given session
   * and call it by name, rather than specifying the full query.
   *
   * {@link https://www.postgresql.org/docs/current/sql-prepare.html | Postgres prepare documentation}
   */
  prepare(name) {
    return this._prepare(name);
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  execute = (placeholderValues) => {
    return tracer.startActiveSpan("drizzle.operation", () => {
      return this._prepare().execute(placeholderValues, this.authToken);
    });
  };
};
applyMixins(PgSelectBase, [QueryPromise]);
function createSetOperator(type, isAll) {
  return (leftSelect, rightSelect, ...restSelects) => {
    const setOperators = [rightSelect, ...restSelects].map((select) => ({
      type,
      isAll,
      rightSelect: select
    }));
    for (const setOperator of setOperators) {
      if (!haveSameKeys(leftSelect.getSelectedFields(), setOperator.rightSelect.getSelectedFields())) {
        throw new Error(
          "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
        );
      }
    }
    return leftSelect.addSetOperators(setOperators);
  };
}
var getPgSetOperators = () => ({
  union,
  unionAll,
  intersect,
  intersectAll,
  except,
  exceptAll
});
var union = createSetOperator("union", false);
var unionAll = createSetOperator("union", true);
var intersect = createSetOperator("intersect", false);
var intersectAll = createSetOperator("intersect", true);
var except = createSetOperator("except", false);
var exceptAll = createSetOperator("except", true);

// ../../node_modules/drizzle-orm/pg-core/query-builders/query-builder.js
var QueryBuilder = class {
  static [entityKind] = "PgQueryBuilder";
  dialect;
  dialectConfig;
  constructor(dialect) {
    this.dialect = is(dialect, PgDialect) ? dialect : void 0;
    this.dialectConfig = is(dialect, PgDialect) ? void 0 : dialect;
  }
  $with = (alias, selection) => {
    const queryBuilder = this;
    const as = (qb) => {
      if (typeof qb === "function") {
        qb = qb(queryBuilder);
      }
      return new Proxy(
        new WithSubquery(
          qb.getSQL(),
          selection ?? ("getSelectedFields" in qb ? qb.getSelectedFields() ?? {} : {}),
          alias,
          true
        ),
        new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
      );
    };
    return { as };
  };
  with(...queries) {
    const self = this;
    function select(fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self.getDialect(),
        withList: queries
      });
    }
    function selectDistinct(fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self.getDialect(),
        distinct: true
      });
    }
    function selectDistinctOn(on, fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self.getDialect(),
        distinct: { on }
      });
    }
    return { select, selectDistinct, selectDistinctOn };
  }
  select(fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: void 0,
      dialect: this.getDialect()
    });
  }
  selectDistinct(fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: void 0,
      dialect: this.getDialect(),
      distinct: true
    });
  }
  selectDistinctOn(on, fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: void 0,
      dialect: this.getDialect(),
      distinct: { on }
    });
  }
  // Lazy load dialect to avoid circular dependency
  getDialect() {
    if (!this.dialect) {
      this.dialect = new PgDialect(this.dialectConfig);
    }
    return this.dialect;
  }
};

// ../../node_modules/drizzle-orm/pg-core/utils.js
function extractUsedTable(table) {
  if (is(table, PgTable)) {
    return [table[Schema] ? `${table[Schema]}.${table[Table.Symbol.BaseName]}` : table[Table.Symbol.BaseName]];
  }
  if (is(table, Subquery)) {
    return table._.usedTables ?? [];
  }
  if (is(table, SQL)) {
    return table.usedTables ?? [];
  }
  return [];
}

// ../../node_modules/drizzle-orm/pg-core/query-builders/delete.js
var PgDeleteBase = class extends QueryPromise {
  constructor(table, session, dialect, withList) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { table, withList };
  }
  static [entityKind] = "PgDelete";
  config;
  cacheConfig;
  /**
   * Adds a `where` clause to the query.
   *
   * Calling this method will delete only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/delete}
   *
   * @param where the `where` clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be deleted.
   *
   * ```ts
   * // Delete all cars with green color
   * await db.delete(cars).where(eq(cars.color, 'green'));
   * // or
   * await db.delete(cars).where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Delete all BMW cars with a green color
   * await db.delete(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Delete all cars with the green or blue color
   * await db.delete(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    this.config.where = where;
    return this;
  }
  returning(fields = this.config.table[Table.Symbol.Columns]) {
    this.config.returningFields = fields;
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildDeleteQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(name) {
    return tracer.startActiveSpan("drizzle.prepareQuery", () => {
      return this.session.prepareQuery(this.dialect.sqlToQuery(this.getSQL()), this.config.returning, name, true, void 0, {
        type: "delete",
        tables: extractUsedTable(this.config.table)
      }, this.cacheConfig);
    });
  }
  prepare(name) {
    return this._prepare(name);
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  execute = (placeholderValues) => {
    return tracer.startActiveSpan("drizzle.operation", () => {
      return this._prepare().execute(placeholderValues, this.authToken);
    });
  };
  /** @internal */
  getSelectedFields() {
    return this.config.returningFields ? new Proxy(
      this.config.returningFields,
      new SelectionProxyHandler({
        alias: getTableName(this.config.table),
        sqlAliasedBehavior: "alias",
        sqlBehavior: "error"
      })
    ) : void 0;
  }
  $dynamic() {
    return this;
  }
};

// ../../node_modules/drizzle-orm/pg-core/query-builders/insert.js
var PgInsertBuilder = class {
  constructor(table, session, dialect, withList, overridingSystemValue_) {
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.withList = withList;
    this.overridingSystemValue_ = overridingSystemValue_;
  }
  static [entityKind] = "PgInsertBuilder";
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  overridingSystemValue() {
    this.overridingSystemValue_ = true;
    return this;
  }
  values(values) {
    values = Array.isArray(values) ? values : [values];
    if (values.length === 0) {
      throw new Error("values() must be called with at least one value");
    }
    const mappedValues = values.map((entry) => {
      const result = {};
      const cols = this.table[Table.Symbol.Columns];
      for (const colKey of Object.keys(entry)) {
        const colValue = entry[colKey];
        result[colKey] = is(colValue, SQL) ? colValue : new Param(colValue, cols[colKey]);
      }
      return result;
    });
    return new PgInsertBase(
      this.table,
      mappedValues,
      this.session,
      this.dialect,
      this.withList,
      false,
      this.overridingSystemValue_
    ).setToken(this.authToken);
  }
  select(selectQuery) {
    const select = typeof selectQuery === "function" ? selectQuery(new QueryBuilder()) : selectQuery;
    if (!is(select, SQL) && !haveSameKeys(this.table[Columns], select._.selectedFields)) {
      throw new Error(
        "Insert select error: selected fields are not the same or are in a different order compared to the table definition"
      );
    }
    return new PgInsertBase(this.table, select, this.session, this.dialect, this.withList, true);
  }
};
var PgInsertBase = class extends QueryPromise {
  constructor(table, values, session, dialect, withList, select, overridingSystemValue_) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { table, values, withList, select, overridingSystemValue_ };
  }
  static [entityKind] = "PgInsert";
  config;
  cacheConfig;
  returning(fields = this.config.table[Table.Symbol.Columns]) {
    this.config.returningFields = fields;
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /**
   * Adds an `on conflict do nothing` clause to the query.
   *
   * Calling this method simply avoids inserting a row as its alternative action.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert#on-conflict-do-nothing}
   *
   * @param config The `target` and `where` clauses.
   *
   * @example
   * ```ts
   * // Insert one row and cancel the insert if there's a conflict
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoNothing();
   *
   * // Explicitly specify conflict target
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoNothing({ target: cars.id });
   * ```
   */
  onConflictDoNothing(config = {}) {
    if (config.target === void 0) {
      this.config.onConflict = sql`do nothing`;
    } else {
      let targetColumn = "";
      targetColumn = Array.isArray(config.target) ? config.target.map((it) => this.dialect.escapeName(this.dialect.casing.getColumnCasing(it))).join(",") : this.dialect.escapeName(this.dialect.casing.getColumnCasing(config.target));
      const whereSql = config.where ? sql` where ${config.where}` : void 0;
      this.config.onConflict = sql`(${sql.raw(targetColumn)})${whereSql} do nothing`;
    }
    return this;
  }
  /**
   * Adds an `on conflict do update` clause to the query.
   *
   * Calling this method will update the existing row that conflicts with the row proposed for insertion as its alternative action.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert#upserts-and-conflicts}
   *
   * @param config The `target`, `set` and `where` clauses.
   *
   * @example
   * ```ts
   * // Update the row if there's a conflict
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoUpdate({
   *     target: cars.id,
   *     set: { brand: 'Porsche' }
   *   });
   *
   * // Upsert with 'where' clause
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoUpdate({
   *     target: cars.id,
   *     set: { brand: 'newBMW' },
   *     targetWhere: sql`${cars.createdAt} > '2023-01-01'::date`,
   *   });
   * ```
   */
  onConflictDoUpdate(config) {
    if (config.where && (config.targetWhere || config.setWhere)) {
      throw new Error(
        'You cannot use both "where" and "targetWhere"/"setWhere" at the same time - "where" is deprecated, use "targetWhere" or "setWhere" instead.'
      );
    }
    const whereSql = config.where ? sql` where ${config.where}` : void 0;
    const targetWhereSql = config.targetWhere ? sql` where ${config.targetWhere}` : void 0;
    const setWhereSql = config.setWhere ? sql` where ${config.setWhere}` : void 0;
    const setSql = this.dialect.buildUpdateSet(this.config.table, mapUpdateSet(this.config.table, config.set));
    let targetColumn = "";
    targetColumn = Array.isArray(config.target) ? config.target.map((it) => this.dialect.escapeName(this.dialect.casing.getColumnCasing(it))).join(",") : this.dialect.escapeName(this.dialect.casing.getColumnCasing(config.target));
    this.config.onConflict = sql`(${sql.raw(targetColumn)})${targetWhereSql} do update set ${setSql}${whereSql}${setWhereSql}`;
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildInsertQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(name) {
    return tracer.startActiveSpan("drizzle.prepareQuery", () => {
      return this.session.prepareQuery(this.dialect.sqlToQuery(this.getSQL()), this.config.returning, name, true, void 0, {
        type: "insert",
        tables: extractUsedTable(this.config.table)
      }, this.cacheConfig);
    });
  }
  prepare(name) {
    return this._prepare(name);
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  execute = (placeholderValues) => {
    return tracer.startActiveSpan("drizzle.operation", () => {
      return this._prepare().execute(placeholderValues, this.authToken);
    });
  };
  /** @internal */
  getSelectedFields() {
    return this.config.returningFields ? new Proxy(
      this.config.returningFields,
      new SelectionProxyHandler({
        alias: getTableName(this.config.table),
        sqlAliasedBehavior: "alias",
        sqlBehavior: "error"
      })
    ) : void 0;
  }
  $dynamic() {
    return this;
  }
};

// ../../node_modules/drizzle-orm/pg-core/query-builders/refresh-materialized-view.js
var PgRefreshMaterializedView = class extends QueryPromise {
  constructor(view, session, dialect) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { view };
  }
  static [entityKind] = "PgRefreshMaterializedView";
  config;
  concurrently() {
    if (this.config.withNoData !== void 0) {
      throw new Error("Cannot use concurrently and withNoData together");
    }
    this.config.concurrently = true;
    return this;
  }
  withNoData() {
    if (this.config.concurrently !== void 0) {
      throw new Error("Cannot use concurrently and withNoData together");
    }
    this.config.withNoData = true;
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildRefreshMaterializedViewQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(name) {
    return tracer.startActiveSpan("drizzle.prepareQuery", () => {
      return this.session.prepareQuery(this.dialect.sqlToQuery(this.getSQL()), void 0, name, true);
    });
  }
  prepare(name) {
    return this._prepare(name);
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  execute = (placeholderValues) => {
    return tracer.startActiveSpan("drizzle.operation", () => {
      return this._prepare().execute(placeholderValues, this.authToken);
    });
  };
};

// ../../node_modules/drizzle-orm/pg-core/query-builders/update.js
var PgUpdateBuilder = class {
  constructor(table, session, dialect, withList) {
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.withList = withList;
  }
  static [entityKind] = "PgUpdateBuilder";
  authToken;
  setToken(token) {
    this.authToken = token;
    return this;
  }
  set(values) {
    return new PgUpdateBase(
      this.table,
      mapUpdateSet(this.table, values),
      this.session,
      this.dialect,
      this.withList
    ).setToken(this.authToken);
  }
};
var PgUpdateBase = class extends QueryPromise {
  constructor(table, set, session, dialect, withList) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { set, table, withList, joins: [] };
    this.tableName = getTableLikeName(table);
    this.joinsNotNullableMap = typeof this.tableName === "string" ? { [this.tableName]: true } : {};
  }
  static [entityKind] = "PgUpdate";
  config;
  tableName;
  joinsNotNullableMap;
  cacheConfig;
  from(source) {
    const src = source;
    const tableName = getTableLikeName(src);
    if (typeof tableName === "string") {
      this.joinsNotNullableMap[tableName] = true;
    }
    this.config.from = src;
    return this;
  }
  getTableLikeFields(table) {
    if (is(table, PgTable)) {
      return table[Table.Symbol.Columns];
    } else if (is(table, Subquery)) {
      return table._.selectedFields;
    }
    return table[ViewBaseConfig].selectedFields;
  }
  createJoin(joinType) {
    return (table, on) => {
      const tableName = getTableLikeName(table);
      if (typeof tableName === "string" && this.config.joins.some((join) => join.alias === tableName)) {
        throw new Error(`Alias "${tableName}" is already used in this query`);
      }
      if (typeof on === "function") {
        const from = this.config.from && !is(this.config.from, SQL) ? this.getTableLikeFields(this.config.from) : void 0;
        on = on(
          new Proxy(
            this.config.table[Table.Symbol.Columns],
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          ),
          from && new Proxy(
            from,
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          )
        );
      }
      this.config.joins.push({ on, table, joinType, alias: tableName });
      if (typeof tableName === "string") {
        switch (joinType) {
          case "left": {
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
          case "right": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "inner": {
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "full": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
        }
      }
      return this;
    };
  }
  leftJoin = this.createJoin("left");
  rightJoin = this.createJoin("right");
  innerJoin = this.createJoin("inner");
  fullJoin = this.createJoin("full");
  /**
   * Adds a 'where' clause to the query.
   *
   * Calling this method will update only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/update}
   *
   * @param where the 'where' clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be updated.
   *
   * ```ts
   * // Update all cars with green color
   * await db.update(cars).set({ color: 'red' })
   *   .where(eq(cars.color, 'green'));
   * // or
   * await db.update(cars).set({ color: 'red' })
   *   .where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Update all BMW cars with a green color
   * await db.update(cars).set({ color: 'red' })
   *   .where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Update all cars with the green or blue color
   * await db.update(cars).set({ color: 'red' })
   *   .where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    this.config.where = where;
    return this;
  }
  returning(fields) {
    if (!fields) {
      fields = Object.assign({}, this.config.table[Table.Symbol.Columns]);
      if (this.config.from) {
        const tableName = getTableLikeName(this.config.from);
        if (typeof tableName === "string" && this.config.from && !is(this.config.from, SQL)) {
          const fromFields = this.getTableLikeFields(this.config.from);
          fields[tableName] = fromFields;
        }
        for (const join of this.config.joins) {
          const tableName2 = getTableLikeName(join.table);
          if (typeof tableName2 === "string" && !is(join.table, SQL)) {
            const fromFields = this.getTableLikeFields(join.table);
            fields[tableName2] = fromFields;
          }
        }
      }
    }
    this.config.returningFields = fields;
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildUpdateQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(name) {
    const query = this.session.prepareQuery(this.dialect.sqlToQuery(this.getSQL()), this.config.returning, name, true, void 0, {
      type: "insert",
      tables: extractUsedTable(this.config.table)
    }, this.cacheConfig);
    query.joinsNotNullableMap = this.joinsNotNullableMap;
    return query;
  }
  prepare(name) {
    return this._prepare(name);
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  execute = (placeholderValues) => {
    return this._prepare().execute(placeholderValues, this.authToken);
  };
  /** @internal */
  getSelectedFields() {
    return this.config.returningFields ? new Proxy(
      this.config.returningFields,
      new SelectionProxyHandler({
        alias: getTableName(this.config.table),
        sqlAliasedBehavior: "alias",
        sqlBehavior: "error"
      })
    ) : void 0;
  }
  $dynamic() {
    return this;
  }
};

// ../../node_modules/drizzle-orm/pg-core/query-builders/count.js
var PgCountBuilder = class _PgCountBuilder extends SQL {
  constructor(params) {
    super(_PgCountBuilder.buildEmbeddedCount(params.source, params.filters).queryChunks);
    this.params = params;
    this.mapWith(Number);
    this.session = params.session;
    this.sql = _PgCountBuilder.buildCount(
      params.source,
      params.filters
    );
  }
  sql;
  token;
  static [entityKind] = "PgCountBuilder";
  [Symbol.toStringTag] = "PgCountBuilder";
  session;
  static buildEmbeddedCount(source, filters) {
    return sql`(select count(*) from ${source}${sql.raw(" where ").if(filters)}${filters})`;
  }
  static buildCount(source, filters) {
    return sql`select count(*) as count from ${source}${sql.raw(" where ").if(filters)}${filters};`;
  }
  /** @intrnal */
  setToken(token) {
    this.token = token;
    return this;
  }
  then(onfulfilled, onrejected) {
    return Promise.resolve(this.session.count(this.sql, this.token)).then(
      onfulfilled,
      onrejected
    );
  }
  catch(onRejected) {
    return this.then(void 0, onRejected);
  }
  finally(onFinally) {
    return this.then(
      (value) => {
        onFinally?.();
        return value;
      },
      (reason) => {
        onFinally?.();
        throw reason;
      }
    );
  }
};

// ../../node_modules/drizzle-orm/pg-core/query-builders/query.js
var RelationalQueryBuilder = class {
  constructor(fullSchema, schema, tableNamesMap, table, tableConfig, dialect, session) {
    this.fullSchema = fullSchema;
    this.schema = schema;
    this.tableNamesMap = tableNamesMap;
    this.table = table;
    this.tableConfig = tableConfig;
    this.dialect = dialect;
    this.session = session;
  }
  static [entityKind] = "PgRelationalQueryBuilder";
  findMany(config) {
    return new PgRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? config : {},
      "many"
    );
  }
  findFirst(config) {
    return new PgRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? { ...config, limit: 1 } : { limit: 1 },
      "first"
    );
  }
};
var PgRelationalQuery = class extends QueryPromise {
  constructor(fullSchema, schema, tableNamesMap, table, tableConfig, dialect, session, config, mode) {
    super();
    this.fullSchema = fullSchema;
    this.schema = schema;
    this.tableNamesMap = tableNamesMap;
    this.table = table;
    this.tableConfig = tableConfig;
    this.dialect = dialect;
    this.session = session;
    this.config = config;
    this.mode = mode;
  }
  static [entityKind] = "PgRelationalQuery";
  /** @internal */
  _prepare(name) {
    return tracer.startActiveSpan("drizzle.prepareQuery", () => {
      const { query, builtQuery } = this._toSQL();
      return this.session.prepareQuery(
        builtQuery,
        void 0,
        name,
        true,
        (rawRows, mapColumnValue) => {
          const rows = rawRows.map(
            (row) => mapRelationalRow(this.schema, this.tableConfig, row, query.selection, mapColumnValue)
          );
          if (this.mode === "first") {
            return rows[0];
          }
          return rows;
        }
      );
    });
  }
  prepare(name) {
    return this._prepare(name);
  }
  _getQuery() {
    return this.dialect.buildRelationalQueryWithoutPK({
      fullSchema: this.fullSchema,
      schema: this.schema,
      tableNamesMap: this.tableNamesMap,
      table: this.table,
      tableConfig: this.tableConfig,
      queryConfig: this.config,
      tableAlias: this.tableConfig.tsName
    });
  }
  /** @internal */
  getSQL() {
    return this._getQuery().sql;
  }
  _toSQL() {
    const query = this._getQuery();
    const builtQuery = this.dialect.sqlToQuery(query.sql);
    return { query, builtQuery };
  }
  toSQL() {
    return this._toSQL().builtQuery;
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  execute() {
    return tracer.startActiveSpan("drizzle.operation", () => {
      return this._prepare().execute(void 0, this.authToken);
    });
  }
};

// ../../node_modules/drizzle-orm/pg-core/query-builders/raw.js
var PgRaw = class extends QueryPromise {
  constructor(execute, sql2, query, mapBatchResult) {
    super();
    this.execute = execute;
    this.sql = sql2;
    this.query = query;
    this.mapBatchResult = mapBatchResult;
  }
  static [entityKind] = "PgRaw";
  /** @internal */
  getSQL() {
    return this.sql;
  }
  getQuery() {
    return this.query;
  }
  mapResult(result, isFromBatch) {
    return isFromBatch ? this.mapBatchResult(result) : result;
  }
  _prepare() {
    return this;
  }
  /** @internal */
  isResponseInArrayMode() {
    return false;
  }
};

// ../../node_modules/drizzle-orm/pg-core/db.js
var PgDatabase = class {
  constructor(dialect, session, schema) {
    this.dialect = dialect;
    this.session = session;
    this._ = schema ? {
      schema: schema.schema,
      fullSchema: schema.fullSchema,
      tableNamesMap: schema.tableNamesMap,
      session
    } : {
      schema: void 0,
      fullSchema: {},
      tableNamesMap: {},
      session
    };
    this.query = {};
    if (this._.schema) {
      for (const [tableName, columns] of Object.entries(this._.schema)) {
        this.query[tableName] = new RelationalQueryBuilder(
          schema.fullSchema,
          this._.schema,
          this._.tableNamesMap,
          schema.fullSchema[tableName],
          columns,
          dialect,
          session
        );
      }
    }
    this.$cache = { invalidate: async (_params) => {
    } };
  }
  static [entityKind] = "PgDatabase";
  query;
  /**
   * Creates a subquery that defines a temporary named result set as a CTE.
   *
   * It is useful for breaking down complex queries into simpler parts and for reusing the result set in subsequent parts of the query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
   *
   * @param alias The alias for the subquery.
   *
   * Failure to provide an alias will result in a DrizzleTypeError, preventing the subquery from being referenced in other queries.
   *
   * @example
   *
   * ```ts
   * // Create a subquery with alias 'sq' and use it in the select query
   * const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
   *
   * const result = await db.with(sq).select().from(sq);
   * ```
   *
   * To select arbitrary SQL values as fields in a CTE and reference them in other CTEs or in the main query, you need to add aliases to them:
   *
   * ```ts
   * // Select an arbitrary SQL value as a field in a CTE and reference it in the main query
   * const sq = db.$with('sq').as(db.select({
   *   name: sql<string>`upper(${users.name})`.as('name'),
   * })
   * .from(users));
   *
   * const result = await db.with(sq).select({ name: sq.name }).from(sq);
   * ```
   */
  $with = (alias, selection) => {
    const self = this;
    const as = (qb) => {
      if (typeof qb === "function") {
        qb = qb(new QueryBuilder(self.dialect));
      }
      return new Proxy(
        new WithSubquery(
          qb.getSQL(),
          selection ?? ("getSelectedFields" in qb ? qb.getSelectedFields() ?? {} : {}),
          alias,
          true
        ),
        new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
      );
    };
    return { as };
  };
  $count(source, filters) {
    return new PgCountBuilder({ source, filters, session: this.session });
  }
  $cache;
  /**
   * Incorporates a previously defined CTE (using `$with`) into the main query.
   *
   * This method allows the main query to reference a temporary named result set.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
   *
   * @param queries The CTEs to incorporate into the main query.
   *
   * @example
   *
   * ```ts
   * // Define a subquery 'sq' as a CTE using $with
   * const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
   *
   * // Incorporate the CTE 'sq' into the main query and select from it
   * const result = await db.with(sq).select().from(sq);
   * ```
   */
  with(...queries) {
    const self = this;
    function select(fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: self.session,
        dialect: self.dialect,
        withList: queries
      });
    }
    function selectDistinct(fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: self.session,
        dialect: self.dialect,
        withList: queries,
        distinct: true
      });
    }
    function selectDistinctOn(on, fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: self.session,
        dialect: self.dialect,
        withList: queries,
        distinct: { on }
      });
    }
    function update(table) {
      return new PgUpdateBuilder(table, self.session, self.dialect, queries);
    }
    function insert(table) {
      return new PgInsertBuilder(table, self.session, self.dialect, queries);
    }
    function delete_(table) {
      return new PgDeleteBase(table, self.session, self.dialect, queries);
    }
    return { select, selectDistinct, selectDistinctOn, update, insert, delete: delete_ };
  }
  select(fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: this.session,
      dialect: this.dialect
    });
  }
  selectDistinct(fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: this.session,
      dialect: this.dialect,
      distinct: true
    });
  }
  selectDistinctOn(on, fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: this.session,
      dialect: this.dialect,
      distinct: { on }
    });
  }
  /**
   * Creates an update query.
   *
   * Calling this method without `.where()` clause will update all rows in a table. The `.where()` clause specifies which rows should be updated.
   *
   * Use `.set()` method to specify which values to update.
   *
   * See docs: {@link https://orm.drizzle.team/docs/update}
   *
   * @param table The table to update.
   *
   * @example
   *
   * ```ts
   * // Update all rows in the 'cars' table
   * await db.update(cars).set({ color: 'red' });
   *
   * // Update rows with filters and conditions
   * await db.update(cars).set({ color: 'red' }).where(eq(cars.brand, 'BMW'));
   *
   * // Update with returning clause
   * const updatedCar: Car[] = await db.update(cars)
   *   .set({ color: 'red' })
   *   .where(eq(cars.id, 1))
   *   .returning();
   * ```
   */
  update(table) {
    return new PgUpdateBuilder(table, this.session, this.dialect);
  }
  /**
   * Creates an insert query.
   *
   * Calling this method will create new rows in a table. Use `.values()` method to specify which values to insert.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert}
   *
   * @param table The table to insert into.
   *
   * @example
   *
   * ```ts
   * // Insert one row
   * await db.insert(cars).values({ brand: 'BMW' });
   *
   * // Insert multiple rows
   * await db.insert(cars).values([{ brand: 'BMW' }, { brand: 'Porsche' }]);
   *
   * // Insert with returning clause
   * const insertedCar: Car[] = await db.insert(cars)
   *   .values({ brand: 'BMW' })
   *   .returning();
   * ```
   */
  insert(table) {
    return new PgInsertBuilder(table, this.session, this.dialect);
  }
  /**
   * Creates a delete query.
   *
   * Calling this method without `.where()` clause will delete all rows in a table. The `.where()` clause specifies which rows should be deleted.
   *
   * See docs: {@link https://orm.drizzle.team/docs/delete}
   *
   * @param table The table to delete from.
   *
   * @example
   *
   * ```ts
   * // Delete all rows in the 'cars' table
   * await db.delete(cars);
   *
   * // Delete rows with filters and conditions
   * await db.delete(cars).where(eq(cars.color, 'green'));
   *
   * // Delete with returning clause
   * const deletedCar: Car[] = await db.delete(cars)
   *   .where(eq(cars.id, 1))
   *   .returning();
   * ```
   */
  delete(table) {
    return new PgDeleteBase(table, this.session, this.dialect);
  }
  refreshMaterializedView(view) {
    return new PgRefreshMaterializedView(view, this.session, this.dialect);
  }
  authToken;
  execute(query) {
    const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
    const builtQuery = this.dialect.sqlToQuery(sequel);
    const prepared = this.session.prepareQuery(
      builtQuery,
      void 0,
      void 0,
      false
    );
    return new PgRaw(
      () => prepared.execute(void 0, this.authToken),
      sequel,
      builtQuery,
      (result) => prepared.mapResult(result, true)
    );
  }
  transaction(transaction, config) {
    return this.session.transaction(transaction, config);
  }
};

// ../../node_modules/drizzle-orm/cache/core/cache.js
var Cache = class {
  static [entityKind] = "Cache";
};
var NoopCache = class extends Cache {
  strategy() {
    return "all";
  }
  static [entityKind] = "NoopCache";
  async get(_key) {
    return void 0;
  }
  async put(_hashedQuery, _response, _tables, _config) {
  }
  async onMutate(_params) {
  }
};
async function hashQuery(sql2, params) {
  const dataToHash = `${sql2}-${JSON.stringify(params)}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(dataToHash);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = [...new Uint8Array(hashBuffer)];
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

// ../../node_modules/drizzle-orm/pg-core/session.js
var PgPreparedQuery = class {
  constructor(query, cache, queryMetadata, cacheConfig) {
    this.query = query;
    this.cache = cache;
    this.queryMetadata = queryMetadata;
    this.cacheConfig = cacheConfig;
    if (cache && cache.strategy() === "all" && cacheConfig === void 0) {
      this.cacheConfig = { enable: true, autoInvalidate: true };
    }
    if (!this.cacheConfig?.enable) {
      this.cacheConfig = void 0;
    }
  }
  authToken;
  getQuery() {
    return this.query;
  }
  mapResult(response, _isFromBatch) {
    return response;
  }
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  static [entityKind] = "PgPreparedQuery";
  /** @internal */
  joinsNotNullableMap;
  /** @internal */
  async queryWithCache(queryString, params, query) {
    if (this.cache === void 0 || is(this.cache, NoopCache) || this.queryMetadata === void 0) {
      try {
        return await query();
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if (this.cacheConfig && !this.cacheConfig.enable) {
      try {
        return await query();
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if ((this.queryMetadata.type === "insert" || this.queryMetadata.type === "update" || this.queryMetadata.type === "delete") && this.queryMetadata.tables.length > 0) {
      try {
        const [res] = await Promise.all([
          query(),
          this.cache.onMutate({ tables: this.queryMetadata.tables })
        ]);
        return res;
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if (!this.cacheConfig) {
      try {
        return await query();
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if (this.queryMetadata.type === "select") {
      const fromCache = await this.cache.get(
        this.cacheConfig.tag ?? await hashQuery(queryString, params),
        this.queryMetadata.tables,
        this.cacheConfig.tag !== void 0,
        this.cacheConfig.autoInvalidate
      );
      if (fromCache === void 0) {
        let result;
        try {
          result = await query();
        } catch (e) {
          throw new DrizzleQueryError(queryString, params, e);
        }
        await this.cache.put(
          this.cacheConfig.tag ?? await hashQuery(queryString, params),
          result,
          // make sure we send tables that were used in a query only if user wants to invalidate it on each write
          this.cacheConfig.autoInvalidate ? this.queryMetadata.tables : [],
          this.cacheConfig.tag !== void 0,
          this.cacheConfig.config
        );
        return result;
      }
      return fromCache;
    }
    try {
      return await query();
    } catch (e) {
      throw new DrizzleQueryError(queryString, params, e);
    }
  }
};
var PgSession = class {
  constructor(dialect) {
    this.dialect = dialect;
  }
  static [entityKind] = "PgSession";
  /** @internal */
  execute(query, token) {
    return tracer.startActiveSpan("drizzle.operation", () => {
      const prepared = tracer.startActiveSpan("drizzle.prepareQuery", () => {
        return this.prepareQuery(
          this.dialect.sqlToQuery(query),
          void 0,
          void 0,
          false
        );
      });
      return prepared.setToken(token).execute(void 0, token);
    });
  }
  all(query) {
    return this.prepareQuery(
      this.dialect.sqlToQuery(query),
      void 0,
      void 0,
      false
    ).all();
  }
  /** @internal */
  async count(sql2, token) {
    const res = await this.execute(sql2, token);
    return Number(
      res[0]["count"]
    );
  }
};
var PgTransaction = class extends PgDatabase {
  constructor(dialect, session, schema, nestedIndex = 0) {
    super(dialect, session, schema);
    this.schema = schema;
    this.nestedIndex = nestedIndex;
  }
  static [entityKind] = "PgTransaction";
  rollback() {
    throw new TransactionRollbackError();
  }
  /** @internal */
  getTransactionConfigSQL(config) {
    const chunks = [];
    if (config.isolationLevel) {
      chunks.push(`isolation level ${config.isolationLevel}`);
    }
    if (config.accessMode) {
      chunks.push(config.accessMode);
    }
    if (typeof config.deferrable === "boolean") {
      chunks.push(config.deferrable ? "deferrable" : "not deferrable");
    }
    return sql.raw(chunks.join(" "));
  }
  setTransaction(config) {
    return this.session.execute(sql`set transaction ${this.getTransactionConfigSQL(config)}`);
  }
};

// ../../node_modules/drizzle-orm/postgres-js/session.js
var PostgresJsPreparedQuery = class extends PgPreparedQuery {
  constructor(client, queryString, params, logger, cache, queryMetadata, cacheConfig, fields, _isResponseInArrayMode, customResultMapper) {
    super({ sql: queryString, params }, cache, queryMetadata, cacheConfig);
    this.client = client;
    this.queryString = queryString;
    this.params = params;
    this.logger = logger;
    this.fields = fields;
    this._isResponseInArrayMode = _isResponseInArrayMode;
    this.customResultMapper = customResultMapper;
  }
  static [entityKind] = "PostgresJsPreparedQuery";
  async execute(placeholderValues = {}) {
    return tracer.startActiveSpan("drizzle.execute", async (span) => {
      const params = fillPlaceholders(this.params, placeholderValues);
      span?.setAttributes({
        "drizzle.query.text": this.queryString,
        "drizzle.query.params": JSON.stringify(params)
      });
      this.logger.logQuery(this.queryString, params);
      const { fields, queryString: query, client, joinsNotNullableMap, customResultMapper } = this;
      if (!fields && !customResultMapper) {
        return tracer.startActiveSpan("drizzle.driver.execute", () => {
          return this.queryWithCache(query, params, async () => {
            return await client.unsafe(query, params);
          });
        });
      }
      const rows = await tracer.startActiveSpan("drizzle.driver.execute", () => {
        span?.setAttributes({
          "drizzle.query.text": query,
          "drizzle.query.params": JSON.stringify(params)
        });
        return this.queryWithCache(query, params, async () => {
          return await client.unsafe(query, params).values();
        });
      });
      return tracer.startActiveSpan("drizzle.mapResponse", () => {
        return customResultMapper ? customResultMapper(rows) : rows.map((row) => mapResultRow(fields, row, joinsNotNullableMap));
      });
    });
  }
  all(placeholderValues = {}) {
    return tracer.startActiveSpan("drizzle.execute", async (span) => {
      const params = fillPlaceholders(this.params, placeholderValues);
      span?.setAttributes({
        "drizzle.query.text": this.queryString,
        "drizzle.query.params": JSON.stringify(params)
      });
      this.logger.logQuery(this.queryString, params);
      return tracer.startActiveSpan("drizzle.driver.execute", () => {
        span?.setAttributes({
          "drizzle.query.text": this.queryString,
          "drizzle.query.params": JSON.stringify(params)
        });
        return this.queryWithCache(this.queryString, params, async () => {
          return this.client.unsafe(this.queryString, params);
        });
      });
    });
  }
  /** @internal */
  isResponseInArrayMode() {
    return this._isResponseInArrayMode;
  }
};
var PostgresJsSession = class _PostgresJsSession extends PgSession {
  constructor(client, dialect, schema, options = {}) {
    super(dialect);
    this.client = client;
    this.schema = schema;
    this.options = options;
    this.logger = options.logger ?? new NoopLogger();
    this.cache = options.cache ?? new NoopCache();
  }
  static [entityKind] = "PostgresJsSession";
  logger;
  cache;
  prepareQuery(query, fields, name, isResponseInArrayMode, customResultMapper, queryMetadata, cacheConfig) {
    return new PostgresJsPreparedQuery(
      this.client,
      query.sql,
      query.params,
      this.logger,
      this.cache,
      queryMetadata,
      cacheConfig,
      fields,
      isResponseInArrayMode,
      customResultMapper
    );
  }
  query(query, params) {
    this.logger.logQuery(query, params);
    return this.client.unsafe(query, params).values();
  }
  queryObjects(query, params) {
    return this.client.unsafe(query, params);
  }
  transaction(transaction, config) {
    return this.client.begin(async (client) => {
      const session = new _PostgresJsSession(
        client,
        this.dialect,
        this.schema,
        this.options
      );
      const tx = new PostgresJsTransaction(this.dialect, session, this.schema);
      if (config) {
        await tx.setTransaction(config);
      }
      return transaction(tx);
    });
  }
};
var PostgresJsTransaction = class _PostgresJsTransaction extends PgTransaction {
  constructor(dialect, session, schema, nestedIndex = 0) {
    super(dialect, session, schema, nestedIndex);
    this.session = session;
  }
  static [entityKind] = "PostgresJsTransaction";
  transaction(transaction) {
    return this.session.client.savepoint((client) => {
      const session = new PostgresJsSession(
        client,
        this.dialect,
        this.schema,
        this.session.options
      );
      const tx = new _PostgresJsTransaction(this.dialect, session, this.schema);
      return transaction(tx);
    });
  }
};

// ../../node_modules/drizzle-orm/postgres-js/driver.js
var PostgresJsDatabase = class extends PgDatabase {
  static [entityKind] = "PostgresJsDatabase";
};
function construct(client, config = {}) {
  const transparentParser = (val) => val;
  for (const type of ["1184", "1082", "1083", "1114", "1182", "1185", "1115", "1231"]) {
    client.options.parsers[type] = transparentParser;
    client.options.serializers[type] = transparentParser;
  }
  client.options.serializers["114"] = transparentParser;
  client.options.serializers["3802"] = transparentParser;
  const dialect = new PgDialect({ casing: config.casing });
  let logger;
  if (config.logger === true) {
    logger = new DefaultLogger();
  } else if (config.logger !== false) {
    logger = config.logger;
  }
  let schema;
  if (config.schema) {
    const tablesConfig = extractTablesRelationalConfig(
      config.schema,
      createTableRelationsHelpers
    );
    schema = {
      fullSchema: config.schema,
      schema: tablesConfig.tables,
      tableNamesMap: tablesConfig.tableNamesMap
    };
  }
  const session = new PostgresJsSession(client, dialect, schema, { logger, cache: config.cache });
  const db2 = new PostgresJsDatabase(dialect, session, schema);
  db2.$client = client;
  db2.$cache = config.cache;
  if (db2.$cache) {
    db2.$cache["invalidate"] = config.cache?.onMutate;
  }
  return db2;
}
function drizzle(...params) {
  if (typeof params[0] === "string") {
    const instance = pgClient(params[0]);
    return construct(instance, params[1]);
  }
  if (isConfig(params[0])) {
    const { connection, client, ...drizzleConfig } = params[0];
    if (client) return construct(client, drizzleConfig);
    if (typeof connection === "object" && connection.url !== void 0) {
      const { url, ...config } = connection;
      const instance2 = pgClient(url, config);
      return construct(instance2, drizzleConfig);
    }
    const instance = pgClient(connection);
    return construct(instance, drizzleConfig);
  }
  return construct(params[0], params[1]);
}
((drizzle2) => {
  function mock(config) {
    return construct({
      options: {
        parsers: {},
        serializers: {}
      }
    }, config);
  }
  drizzle2.mock = mock;
})(drizzle || (drizzle = {}));

// src/features/auth/routes.ts
import { Hono } from "hono";

// src/lib/db.ts
import postgres from "postgres";

// ../../src/db/schema/index.ts
var schema_exports = {};
__export(schema_exports, {
  billingPeriodEnum: () => billingPeriodEnum,
  branches: () => branches,
  branchesRelations: () => branchesRelations,
  cash: () => cash,
  cashCategories: () => cashCategories,
  cashCategoryTypeEnum: () => cashCategoryTypeEnum,
  cashRelations: () => cashRelations,
  customers: () => customers,
  memberRoleEnum: () => memberRoleEnum,
  orderStatusEnum: () => orderStatusEnum,
  outboxLogs: () => outboxLogs,
  paymentMethodEnum: () => paymentMethodEnum,
  paymentMethods: () => paymentMethods,
  paymentStatusEnum: () => paymentStatusEnum,
  payments: () => payments,
  platformAuditLogs: () => platformAuditLogs,
  productCategories: () => productCategories,
  productTypeEnum: () => productTypeEnum,
  productionBatches: () => productionBatches,
  products: () => products,
  purchaseItems: () => purchaseItems,
  purchaseStatusEnum: () => purchaseStatusEnum,
  purchases: () => purchases,
  purchasesRelations: () => purchasesRelations,
  recipeStatusEnum: () => recipeStatusEnum,
  recipes: () => recipes,
  returnItems: () => returnItems,
  returnStatusEnum: () => returnStatusEnum,
  returnTypeEnum: () => returnTypeEnum,
  returns: () => returns,
  returnsRelations: () => returnsRelations,
  salesOrderItems: () => salesOrderItems,
  salesOrders: () => salesOrders,
  salesOrdersRelations: () => salesOrdersRelations,
  serviceOrderStatusEnum: () => serviceOrderStatusEnum,
  serviceOrders: () => serviceOrders,
  serviceOrdersRelations: () => serviceOrdersRelations,
  settings: () => settings,
  settingsRelations: () => settingsRelations,
  shiftStatusEnum: () => shiftStatusEnum,
  shifts: () => shifts,
  shiftsRelations: () => shiftsRelations,
  stockMovementTypeEnum: () => stockMovementTypeEnum,
  stockMovements: () => stockMovements,
  subscriptionPlans: () => subscriptionPlans,
  subscriptionStatusEnum: () => subscriptionStatusEnum,
  suppliers: () => suppliers,
  suppliersRelations: () => suppliersRelations,
  syncStatusEnum: () => syncStatusEnum,
  tenantMembers: () => tenantMembers,
  tenants: () => tenants,
  tenantsRelations: () => tenantsRelations,
  userRoleEnum: () => userRoleEnum,
  users: () => users,
  warehouses: () => warehouses
});

// ../../src/db/schema/core.ts
import { relations } from "drizzle-orm";
import { boolean, index, integer, jsonb, numeric, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
var memberRoleEnum = pgEnum("member_role", ["owner", "admin", "cashier", "staff"]);
var userRoleEnum = pgEnum("user_role", ["user", "platform_admin"]);
var orderStatusEnum = pgEnum("order_status", ["draft", "confirmed", "unpaid", "partial", "paid", "receivable", "cancelled", "refunded"]);
var paymentMethodEnum = pgEnum("payment_method", ["cash", "qris", "card", "transfer", "ewallet", "receivable"]);
var paymentStatusEnum = pgEnum("payment_status", ["success", "pending", "failed", "refunded", "partial_refund"]);
var productTypeEnum = pgEnum("product_type", ["physical", "service"]);
var stockMovementTypeEnum = pgEnum("stock_movement_type", ["sale", "purchase", "return", "adjustment", "transfer_in", "transfer_out", "damage_lost", "production"]);
var syncStatusEnum = pgEnum("sync_status", ["synced", "pending", "failed", "conflict"]);
var cashCategoryTypeEnum = pgEnum("cash_category_type", ["income", "expense"]);
var shiftStatusEnum = pgEnum("shift_status", ["open", "closed"]);
var purchaseStatusEnum = pgEnum("purchase_status", ["draft", "shipped", "received", "cancelled"]);
var returnTypeEnum = pgEnum("return_type", ["sale", "purchase"]);
var returnStatusEnum = pgEnum("return_status", ["draft", "processing", "completed", "cancelled"]);
var serviceOrderStatusEnum = pgEnum("service_order_status", ["received", "in_progress", "completed", "picked_up", "cancelled"]);
var recipeStatusEnum = pgEnum("recipe_status", ["draft", "active"]);
var timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true })
};
var subscriptionStatusEnum = pgEnum("subscription_status", ["trial", "active", "past_due", "suspended", "cancelled"]);
var billingPeriodEnum = pgEnum("billing_period", ["monthly", "yearly"]);
var tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 160 }).notNull(),
  legalName: varchar("legal_name", { length: 200 }),
  npwp: varchar("npwp", { length: 64 }),
  nib: varchar("nib", { length: 64 }),
  phone: varchar("phone", { length: 40 }),
  email: varchar("email", { length: 160 }),
  address: text("address"),
  planCode: varchar("plan_code", { length: 40 }).default("free").notNull(),
  billingPeriod: billingPeriodEnum("billing_period").default("monthly").notNull(),
  subscriptionStatus: subscriptionStatusEnum("subscription_status").default("trial").notNull(),
  planValidUntil: timestamp("plan_valid_until", { withTimezone: true }),
  storageLimitMb: integer("storage_limit_mb").default(512).notNull(),
  maxBranches: integer("max_branches").default(1).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps
});
var branches = pgTable("branches", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  name: varchar("name", { length: 160 }).notNull(),
  address: text("address"),
  phone: varchar("phone", { length: 40 }),
  isDefault: boolean("is_default").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps
}, (table) => [index("branches_tenant_id_idx").on(table.tenantId)]);
var users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 160 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").default("user").notNull(),
  avatarUrl: text("avatar_url"),
  ...timestamps
});
var subscriptionPlans = pgTable("subscription_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 40 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  billingPeriod: billingPeriodEnum("billing_period").default("monthly").notNull(),
  durationDays: integer("duration_days").default(30).notNull(),
  trialDays: integer("trial_days").default(0).notNull(),
  monthlyPrice: numeric("monthly_price", { precision: 14, scale: 2 }).default("0").notNull(),
  yearlyPrice: numeric("yearly_price", { precision: 14, scale: 2 }),
  storageLimitMb: integer("storage_limit_mb").default(512).notNull(),
  maxBranches: integer("max_branches").default(1).notNull(),
  maxUsers: integer("max_users").default(1).notNull(),
  features: jsonb("features").default({}).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps
});
var platformAuditLogs = pgTable("platform_audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id").notNull().references(() => users.id),
  action: varchar("action", { length: 80 }).notNull(),
  targetType: varchar("target_type", { length: 40 }).notNull(),
  targetId: uuid("target_id"),
  payload: jsonb("payload").default({}).notNull(),
  ...timestamps
}, (table) => [index("platform_audit_logs_actor_id_idx").on(table.actorId), index("platform_audit_logs_target_idx").on(table.targetType, table.targetId)]);
var tenantMembers = pgTable("tenant_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  role: memberRoleEnum("role").default("staff").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps
}, (table) => [index("tenant_members_tenant_id_idx").on(table.tenantId), index("tenant_members_user_id_idx").on(table.userId)]);
var warehouses = pgTable("warehouses", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  branchId: uuid("branch_id").references(() => branches.id),
  name: varchar("name", { length: 160 }).notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps
}, (table) => [index("warehouses_tenant_id_idx").on(table.tenantId), index("warehouses_branch_id_idx").on(table.branchId)]);
var productCategories = pgTable("product_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  name: varchar("name", { length: 120 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  syncStatus: syncStatusEnum("sync_status").default("synced").notNull(),
  version: integer("version").default(1).notNull(),
  ...timestamps
}, (table) => [index("product_categories_tenant_id_idx").on(table.tenantId)]);
var products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  branchId: uuid("branch_id").references(() => branches.id),
  categoryId: uuid("category_id").references(() => productCategories.id),
  name: varchar("name", { length: 180 }).notNull(),
  sku: varchar("sku", { length: 80 }),
  barcode: varchar("barcode", { length: 120 }),
  type: productTypeEnum("type").default("physical").notNull(),
  salePrice: numeric("sale_price", { precision: 14, scale: 2 }).notNull(),
  wholesalePrice: numeric("wholesale_price", { precision: 14, scale: 2 }),
  costPrice: numeric("cost_price", { precision: 14, scale: 2 }),
  minimumStock: integer("minimum_stock").default(0).notNull(),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true).notNull(),
  syncStatus: syncStatusEnum("sync_status").default("synced").notNull(),
  version: integer("version").default(1).notNull(),
  ...timestamps
}, (table) => [index("products_tenant_id_idx").on(table.tenantId), index("products_branch_id_idx").on(table.branchId), index("products_category_id_idx").on(table.categoryId)]);
var customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  branchId: uuid("branch_id").references(() => branches.id),
  name: varchar("name", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  email: varchar("email", { length: 160 }),
  address: text("address"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
  syncStatus: syncStatusEnum("sync_status").default("synced").notNull(),
  version: integer("version").default(1).notNull(),
  ...timestamps
}, (table) => [index("customers_tenant_id_idx").on(table.tenantId), index("customers_branch_id_idx").on(table.branchId)]);
var salesOrders = pgTable("sales_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  branchId: uuid("branch_id").notNull().references(() => branches.id),
  customerId: uuid("customer_id").references(() => customers.id),
  orderNumber: varchar("order_number", { length: 80 }).notNull(),
  status: orderStatusEnum("status").default("draft").notNull(),
  subtotal: numeric("subtotal", { precision: 14, scale: 2 }).default("0").notNull(),
  discountTotal: numeric("discount_total", { precision: 14, scale: 2 }).default("0").notNull(),
  taxTotal: numeric("tax_total", { precision: 14, scale: 2 }).default("0").notNull(),
  grandTotal: numeric("grand_total", { precision: 14, scale: 2 }).default("0").notNull(),
  paidTotal: numeric("paid_total", { precision: 14, scale: 2 }).default("0").notNull(),
  notes: text("notes"),
  syncStatus: syncStatusEnum("sync_status").default("pending").notNull(),
  version: integer("version").default(1).notNull(),
  ...timestamps
}, (table) => [index("sales_orders_tenant_id_idx").on(table.tenantId), index("sales_orders_branch_id_idx").on(table.branchId), index("sales_orders_customer_id_idx").on(table.customerId)]);
var salesOrderItems = pgTable("sales_order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  salesOrderId: uuid("sales_order_id").notNull().references(() => salesOrders.id),
  productId: uuid("product_id").references(() => products.id),
  name: varchar("name", { length: 180 }).notNull(),
  qty: numeric("qty", { precision: 14, scale: 3 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 14, scale: 2 }).notNull(),
  discountTotal: numeric("discount_total", { precision: 14, scale: 2 }).default("0").notNull(),
  subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull(),
  ...timestamps
}, (table) => [index("sales_order_items_tenant_id_idx").on(table.tenantId), index("sales_order_items_order_id_idx").on(table.salesOrderId), index("sales_order_items_product_id_idx").on(table.productId)]);
var payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  branchId: uuid("branch_id").notNull().references(() => branches.id),
  salesOrderId: uuid("sales_order_id").references(() => salesOrders.id),
  serviceOrderId: uuid("service_order_id").references(() => serviceOrders.id),
  purchaseId: uuid("purchase_id").references(() => purchases.id),
  paymentNumber: varchar("payment_number", { length: 80 }).notNull(),
  source: varchar("source", { length: 80 }),
  method: paymentMethodEnum("method").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  referenceNumber: varchar("reference_number", { length: 120 }),
  status: paymentStatusEnum("status").default("pending").notNull(),
  syncStatus: syncStatusEnum("sync_status").default("pending").notNull(),
  ...timestamps
}, (table) => [
  index("payments_tenant_id_idx").on(table.tenantId),
  index("payments_branch_id_idx").on(table.branchId),
  index("payments_order_id_idx").on(table.salesOrderId),
  index("payments_service_order_id_idx").on(table.serviceOrderId),
  index("payments_purchase_id_idx").on(table.purchaseId)
]);
var stockMovements = pgTable("stock_movements", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  branchId: uuid("branch_id").references(() => branches.id),
  warehouseId: uuid("warehouse_id").notNull().references(() => warehouses.id),
  productId: uuid("product_id").notNull().references(() => products.id),
  type: stockMovementTypeEnum("type").notNull(),
  qty: numeric("qty", { precision: 14, scale: 3 }).notNull(),
  referenceType: varchar("reference_type", { length: 80 }),
  referenceId: uuid("reference_id"),
  notes: text("notes"),
  syncStatus: syncStatusEnum("sync_status").default("pending").notNull(),
  ...timestamps
}, (table) => [index("stock_movements_tenant_id_idx").on(table.tenantId), index("stock_movements_warehouse_id_idx").on(table.warehouseId), index("stock_movements_product_id_idx").on(table.productId)]);
var cashCategories = pgTable("cash_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  name: varchar("name", { length: 120 }).notNull(),
  type: cashCategoryTypeEnum("type").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  syncStatus: syncStatusEnum("sync_status").default("synced").notNull(),
  version: integer("version").default(1).notNull(),
  ...timestamps
}, (table) => [index("cash_categories_tenant_id_idx").on(table.tenantId)]);
var cash = pgTable("cash", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  branchId: uuid("branch_id").references(() => branches.id),
  ref: varchar("ref", { length: 80 }).notNull(),
  date: timestamp("date", { withTimezone: true }).defaultNow().notNull(),
  categoryId: uuid("category_id").references(() => cashCategories.id),
  income: numeric("income", { precision: 14, scale: 2 }).default("0").notNull(),
  expense: numeric("expense", { precision: 14, scale: 2 }).default("0").notNull(),
  status: varchar("status", { length: 40 }).default("posted").notNull(),
  syncStatus: syncStatusEnum("sync_status").default("synced").notNull(),
  ...timestamps
}, (table) => [index("cash_tenant_id_idx").on(table.tenantId), index("cash_branch_id_idx").on(table.branchId)]);
var settings = pgTable("settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  key: varchar("key", { length: 120 }).notNull(),
  area: varchar("area", { length: 80 }).notNull(),
  value: text("value").notNull(),
  status: varchar("status", { length: 40 }).default("active").notNull(),
  syncStatus: syncStatusEnum("sync_status").default("synced").notNull(),
  ...timestamps
}, (table) => [index("settings_tenant_id_idx").on(table.tenantId), index("settings_tenant_key_idx").on(table.tenantId, table.key)]);
var shifts = pgTable("shifts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  branchId: uuid("branch_id").references(() => branches.id),
  cashierName: varchar("cashier_name", { length: 120 }).notNull(),
  startTime: timestamp("start_time", { withTimezone: true }).defaultNow().notNull(),
  endTime: timestamp("end_time", { withTimezone: true }),
  startCash: numeric("start_cash", { precision: 14, scale: 2 }).default("0").notNull(),
  expectedCash: numeric("expected_cash", { precision: 14, scale: 2 }),
  actualCash: numeric("actual_cash", { precision: 14, scale: 2 }),
  difference: numeric("difference", { precision: 14, scale: 2 }),
  status: shiftStatusEnum("status").default("open").notNull(),
  syncStatus: syncStatusEnum("sync_status").default("synced").notNull(),
  ...timestamps
}, (table) => [index("shifts_tenant_id_idx").on(table.tenantId), index("shifts_branch_id_idx").on(table.branchId)]);
var suppliers = pgTable("suppliers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  name: varchar("name", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  city: varchar("city", { length: 80 }),
  payable: numeric("payable", { precision: 14, scale: 2 }).default("0").notNull(),
  orders: integer("orders").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  syncStatus: syncStatusEnum("sync_status").default("synced").notNull(),
  version: integer("version").default(1).notNull(),
  ...timestamps
}, (table) => [index("suppliers_tenant_id_idx").on(table.tenantId)]);
var purchases = pgTable("purchases", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  branchId: uuid("branch_id").references(() => branches.id),
  supplierId: uuid("supplier_id").references(() => suppliers.id),
  code: varchar("code", { length: 80 }).notNull(),
  date: timestamp("date", { withTimezone: true }).defaultNow().notNull(),
  subtotal: numeric("subtotal", { precision: 14, scale: 2 }).default("0").notNull(),
  grandTotal: numeric("grand_total", { precision: 14, scale: 2 }).default("0").notNull(),
  status: purchaseStatusEnum("status").default("draft").notNull(),
  syncStatus: syncStatusEnum("sync_status").default("synced").notNull(),
  version: integer("version").default(1).notNull(),
  ...timestamps
}, (table) => [index("purchases_tenant_id_idx").on(table.tenantId), index("purchases_branch_id_idx").on(table.branchId), index("purchases_supplier_id_idx").on(table.supplierId)]);
var purchaseItems = pgTable("purchase_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  purchaseId: uuid("purchase_id").notNull().references(() => purchases.id),
  productId: uuid("product_id").references(() => products.id),
  name: varchar("name", { length: 180 }).notNull(),
  qty: numeric("qty", { precision: 14, scale: 3 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 14, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull(),
  ...timestamps
}, (table) => [index("purchase_items_tenant_id_idx").on(table.tenantId), index("purchase_items_purchase_id_idx").on(table.purchaseId), index("purchase_items_product_id_idx").on(table.productId)]);
var returns = pgTable("returns", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  branchId: uuid("branch_id").references(() => branches.id),
  code: varchar("code", { length: 80 }).notNull(),
  type: returnTypeEnum("type").notNull(),
  referenceCode: varchar("reference_code", { length: 80 }).notNull(),
  date: timestamp("date", { withTimezone: true }).defaultNow().notNull(),
  total: numeric("total", { precision: 14, scale: 2 }).default("0").notNull(),
  status: returnStatusEnum("status").default("draft").notNull(),
  syncStatus: syncStatusEnum("sync_status").default("synced").notNull(),
  version: integer("version").default(1).notNull(),
  ...timestamps
}, (table) => [index("returns_tenant_id_idx").on(table.tenantId), index("returns_branch_id_idx").on(table.branchId)]);
var returnItems = pgTable("return_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  returnId: uuid("return_id").notNull().references(() => returns.id),
  productId: uuid("product_id").references(() => products.id),
  name: varchar("name", { length: 180 }).notNull(),
  qty: numeric("qty", { precision: 14, scale: 3 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 14, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull(),
  ...timestamps
}, (table) => [index("return_items_tenant_id_idx").on(table.tenantId), index("return_items_return_id_idx").on(table.returnId), index("return_items_product_id_idx").on(table.productId)]);
var serviceOrders = pgTable("service_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  branchId: uuid("branch_id").references(() => branches.id),
  customerId: uuid("customer_id").references(() => customers.id),
  code: varchar("code", { length: 80 }).notNull(),
  customerName: varchar("customer_name", { length: 160 }).notNull(),
  description: text("description"),
  date: timestamp("date", { withTimezone: true }).defaultNow().notNull(),
  cost: numeric("cost", { precision: 14, scale: 2 }).default("0").notNull(),
  paidTotal: numeric("paid_total", { precision: 14, scale: 2 }).default("0").notNull(),
  status: serviceOrderStatusEnum("status").default("received").notNull(),
  syncStatus: syncStatusEnum("sync_status").default("synced").notNull(),
  version: integer("version").default(1).notNull(),
  ...timestamps
}, (table) => [index("service_orders_tenant_id_idx").on(table.tenantId), index("service_orders_branch_id_idx").on(table.branchId), index("service_orders_customer_id_idx").on(table.customerId)]);
var paymentMethods = pgTable("payment_methods", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  name: varchar("name", { length: 120 }).notNull(),
  provider: varchar("provider", { length: 80 }).notNull(),
  type: varchar("type", { length: 80 }).notNull(),
  accountNumber: varchar("account_number", { length: 80 }),
  accountName: varchar("account_name", { length: 160 }),
  status: varchar("status", { length: 40 }).default("active").notNull(),
  ...timestamps
}, (table) => [index("payment_methods_tenant_id_idx").on(table.tenantId)]);
var recipes = pgTable("recipes", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  productId: uuid("product_id").notNull().references(() => products.id),
  productName: varchar("product_name", { length: 180 }).notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  batchYield: integer("batch_yield").default(1).notNull(),
  items: jsonb("items").default([]).notNull(),
  status: recipeStatusEnum("status").default("draft").notNull(),
  ...timestamps
}, (table) => [index("recipes_tenant_id_idx").on(table.tenantId), index("recipes_product_id_idx").on(table.productId)]);
var productionBatches = pgTable("production_batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  branchId: uuid("branch_id").references(() => branches.id),
  recipeId: uuid("recipe_id").notNull().references(() => recipes.id),
  productId: uuid("product_id").notNull().references(() => products.id),
  batchQty: integer("batch_qty").default(1).notNull(),
  date: timestamp("date", { withTimezone: true }).defaultNow().notNull(),
  syncStatus: syncStatusEnum("sync_status").default("synced").notNull(),
  version: integer("version").default(1).notNull(),
  ...timestamps
}, (table) => [index("production_batches_tenant_id_idx").on(table.tenantId), index("production_batches_branch_id_idx").on(table.branchId), index("production_batches_recipe_id_idx").on(table.recipeId), index("production_batches_product_id_idx").on(table.productId)]);
var outboxLogs = pgTable("outbox_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  branchId: uuid("branch_id").references(() => branches.id),
  deviceId: varchar("device_id", { length: 120 }).notNull(),
  entityType: varchar("entity_type", { length: 80 }).notNull(),
  entityId: uuid("entity_id").notNull(),
  mutationType: varchar("mutation_type", { length: 40 }).notNull(),
  payload: jsonb("payload").notNull(),
  status: syncStatusEnum("status").default("pending").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  errorMessage: text("error_message"),
  ...timestamps
}, (table) => [index("outbox_logs_tenant_id_idx").on(table.tenantId), index("outbox_logs_branch_id_idx").on(table.branchId), index("outbox_logs_status_idx").on(table.status)]);
var tenantsRelations = relations(tenants, ({ many }) => ({
  branches: many(branches),
  members: many(tenantMembers),
  products: many(products),
  customers: many(customers)
}));
var branchesRelations = relations(branches, ({ one, many }) => ({
  tenant: one(tenants, { fields: [branches.tenantId], references: [tenants.id] }),
  warehouses: many(warehouses),
  salesOrders: many(salesOrders)
}));
var salesOrdersRelations = relations(salesOrders, ({ one, many }) => ({
  tenant: one(tenants, { fields: [salesOrders.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [salesOrders.branchId], references: [branches.id] }),
  customer: one(customers, { fields: [salesOrders.customerId], references: [customers.id] }),
  items: many(salesOrderItems),
  payments: many(payments)
}));
var cashRelations = relations(cash, ({ one }) => ({
  tenant: one(tenants, { fields: [cash.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [cash.branchId], references: [branches.id] }),
  category: one(cashCategories, { fields: [cash.categoryId], references: [cashCategories.id] })
}));
var settingsRelations = relations(settings, ({ one }) => ({
  tenant: one(tenants, { fields: [settings.tenantId], references: [tenants.id] })
}));
var shiftsRelations = relations(shifts, ({ one }) => ({
  tenant: one(tenants, { fields: [shifts.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [shifts.branchId], references: [branches.id] })
}));
var suppliersRelations = relations(suppliers, ({ one }) => ({
  tenant: one(tenants, { fields: [suppliers.tenantId], references: [tenants.id] })
}));
var purchasesRelations = relations(purchases, ({ one, many }) => ({
  tenant: one(tenants, { fields: [purchases.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [purchases.branchId], references: [branches.id] }),
  supplier: one(suppliers, { fields: [purchases.supplierId], references: [suppliers.id] }),
  items: many(purchaseItems)
}));
var returnsRelations = relations(returns, ({ one, many }) => ({
  tenant: one(tenants, { fields: [returns.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [returns.branchId], references: [branches.id] }),
  items: many(returnItems)
}));
var serviceOrdersRelations = relations(serviceOrders, ({ one }) => ({
  tenant: one(tenants, { fields: [serviceOrders.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [serviceOrders.branchId], references: [branches.id] }),
  customer: one(customers, { fields: [serviceOrders.customerId], references: [customers.id] })
}));

// src/lib/env.ts
function getApiDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required for API database access");
  }
  return url;
}

// src/lib/db.ts
var dbInstance = null;
function getDb() {
  if (dbInstance) {
    return dbInstance;
  }
  const client = postgres(getApiDatabaseUrl(), {
    prepare: false,
    max: 5
  });
  dbInstance = drizzle(client, { schema: schema_exports });
  return dbInstance;
}
var db = new Proxy({}, {
  get(_target, property, receiver) {
    return Reflect.get(getDb(), property, receiver);
  }
});

// ../../src/lib/crypto.ts
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// src/features/auth/routes.ts
var authRoutes = new Hono();
function readUserId(request) {
  const userId = request.headers.get("x-user-id");
  const authorization = request.headers.get("authorization");
  if (userId) return userId;
  if (authorization?.startsWith("Bearer dev-")) return authorization.slice("Bearer dev-".length);
  return null;
}
async function findUserById(appDb, userId) {
  return appDb.query.users.findFirst({
    where: eq(users.id, userId)
  });
}
async function findUserByEmail(appDb, email) {
  return appDb.query.users.findFirst({
    where: eq(users.email, email)
  });
}
async function listActiveMemberships(appDb, userId) {
  return appDb.select({
    tenantId: tenantMembers.tenantId,
    role: tenantMembers.role,
    tenantName: tenants.name,
    tenantPlan: tenants.planCode,
    tenantBillingPeriod: tenants.billingPeriod,
    tenantSubscriptionStatus: tenants.subscriptionStatus,
    tenantPlanValidUntil: tenants.planValidUntil,
    tenantStorageLimitMb: tenants.storageLimitMb,
    tenantMaxBranches: tenants.maxBranches
  }).from(tenantMembers).innerJoin(tenants, eq(tenantMembers.tenantId, tenants.id)).where(and(eq(tenantMembers.userId, userId), eq(tenantMembers.isActive, true), eq(tenants.isActive, true)));
}
function userResponse(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl
  };
}
authRoutes.post("/register", async (c) => {
  const body = await c.req.json().catch(() => null);
  const name = body?.name?.trim();
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password?.trim();
  const tenantName = body?.tenantName?.trim();
  const planCode = body?.planCode?.trim() || "trial-monthly";
  const billingPeriod = body?.billingPeriod === "yearly" ? "yearly" : "monthly";
  if (!name || !email || !password || !tenantName) {
    return c.json({ ok: false, message: "name, email, password, and tenantName required" }, 400);
  }
  const existingUser = await findUserByEmail(db, email);
  if (existingUser) {
    return c.json({ ok: false, message: "Email already registered" }, 409);
  }
  const planRows = await db.select().from(subscriptionPlans).where(and(eq(subscriptionPlans.code, planCode), eq(subscriptionPlans.isActive, true)));
  const plan = planRows[0];
  const now = /* @__PURE__ */ new Date();
  let planValidUntil = null;
  let subscriptionStatus = "active";
  let storageLimitMb = 1024;
  let maxBranches = 1;
  if (plan) {
    storageLimitMb = plan.storageLimitMb;
    maxBranches = plan.maxBranches;
    if (plan.trialDays > 0) {
      subscriptionStatus = "trial";
      planValidUntil = new Date(now);
      planValidUntil.setDate(planValidUntil.getDate() + plan.trialDays);
    } else if (plan.code.startsWith("free")) {
      subscriptionStatus = "active";
      planValidUntil = null;
    } else {
      subscriptionStatus = "active";
      planValidUntil = new Date(now);
      planValidUntil.setDate(planValidUntil.getDate() + plan.durationDays);
    }
  } else {
    subscriptionStatus = "trial";
    planValidUntil = new Date(now);
    planValidUntil.setDate(planValidUntil.getDate() + 14);
  }
  const userId = crypto.randomUUID();
  const tenantId = crypto.randomUUID();
  const branchId = crypto.randomUUID();
  const warehouseId = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  await db.transaction(async (tx) => {
    await tx.insert(users).values({
      id: userId,
      email,
      name,
      passwordHash,
      createdAt: now,
      updatedAt: now
    });
    await tx.insert(tenants).values({
      id: tenantId,
      name: tenantName,
      planCode,
      billingPeriod,
      subscriptionStatus,
      planValidUntil,
      storageLimitMb,
      maxBranches,
      isActive: true,
      createdAt: now,
      updatedAt: now
    });
    await tx.insert(branches).values({
      id: branchId,
      tenantId,
      name: "Cabang Utama",
      isDefault: true,
      isActive: true,
      createdAt: now,
      updatedAt: now
    });
    await tx.insert(warehouses).values({
      id: warehouseId,
      tenantId,
      branchId,
      name: "Gudang Utama",
      isDefault: true,
      isActive: true,
      createdAt: now,
      updatedAt: now
    });
    await tx.insert(tenantMembers).values({
      id: crypto.randomUUID(),
      tenantId,
      userId,
      role: "owner",
      isActive: true,
      createdAt: now,
      updatedAt: now
    });
  });
  const memberships = await listActiveMemberships(db, userId);
  return c.json({
    ok: true,
    accessToken: `dev-${userId}`,
    user: { id: userId, email, name, role: "user" },
    defaultBranchId: branchId,
    defaultWarehouseId: warehouseId,
    memberships
  });
});
authRoutes.get("/me", async (c) => {
  const userId = readUserId(c.req.raw);
  if (!userId) {
    return c.json({ ok: false, message: "x-user-id header or dev token required" }, 401);
  }
  const user = await findUserById(db, userId);
  if (!user) {
    return c.json({ ok: false, message: "User not found" }, 404);
  }
  const memberships = await listActiveMemberships(db, user.id);
  return c.json({ ok: true, user: userResponse(user), memberships });
});
authRoutes.get("/tenants", async (c) => {
  const userId = readUserId(c.req.raw);
  if (!userId) {
    return c.json({ ok: false, message: "x-user-id header or dev token required" }, 401);
  }
  const user = await findUserById(db, userId);
  if (!user) {
    return c.json({ ok: false, message: "User not found" }, 404);
  }
  const memberships = await listActiveMemberships(db, user.id);
  return c.json({ ok: true, items: memberships });
});
authRoutes.post("/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password?.trim();
  if (!email || !password) {
    return c.json({ ok: false, message: "email and password required" }, 400);
  }
  const user = await findUserByEmail(db, email);
  if (!user) {
    return c.json({ ok: false, message: "User not found" }, 404);
  }
  const passwordHash = await hashPassword(password);
  if (user.passwordHash !== passwordHash) {
    return c.json({ ok: false, message: "Email tidak terdaftar atau kata sandi salah" }, 401);
  }
  const memberships = await listActiveMemberships(db, user.id);
  if (memberships.length === 0 && user.role !== "platform_admin") {
    return c.json({ ok: false, message: "Active tenant membership required" }, 403);
  }
  return c.json({
    ok: true,
    accessToken: `dev-${user.id}`,
    user: userResponse(user),
    memberships
  });
});
authRoutes.post("/reset-password", async (c) => {
  const body = await c.req.json().catch(() => null);
  const email = body?.email?.trim().toLowerCase();
  const newPassword = body?.newPassword?.trim();
  if (!email || !newPassword) {
    return c.json({ ok: false, message: "email and newPassword required" }, 400);
  }
  const user = await findUserByEmail(db, email);
  if (!user) {
    return c.json({ ok: false, message: "Email tidak ditemukan" }, 404);
  }
  await db.update(users).set({
    passwordHash: await hashPassword(newPassword),
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(users.id, user.id));
  return c.json({ ok: true });
});

// src/features/health/routes.ts
import { Hono as Hono2 } from "hono";
var healthRoutes = new Hono2();
healthRoutes.get("/", (c) => {
  return c.json({ ok: true, service: "kotacom-api", version: "v1" });
});

// src/features/reports/routes.ts
import { Hono as Hono3 } from "hono";

// src/features/reports/service.ts
function n(val) {
  return Number(val ?? 0);
}
async function getSalesSummary(db2, input) {
  const filters = [eq(salesOrders.tenantId, input.tenantId)];
  if (input.branchId) filters.push(eq(salesOrders.branchId, input.branchId));
  if (input.from) filters.push(gte(salesOrders.createdAt, new Date(input.from)));
  if (input.to) filters.push(lte(salesOrders.createdAt, new Date(input.to)));
  const [summary] = await db2.select({
    orderCount: count(salesOrders.id),
    grossSales: sum(salesOrders.grandTotal),
    paidTotal: sum(salesOrders.paidTotal)
  }).from(salesOrders).where(and(...filters));
  return {
    orderCount: Number(summary?.orderCount ?? 0),
    grossSales: String(summary?.grossSales ?? "0"),
    paidTotal: String(summary?.paidTotal ?? "0")
  };
}
async function getPaymentSummary(db2, input) {
  const filters = [eq(payments.tenantId, input.tenantId)];
  if (input.branchId) filters.push(eq(payments.branchId, input.branchId));
  if (input.from) filters.push(gte(payments.createdAt, new Date(input.from)));
  if (input.to) filters.push(lte(payments.createdAt, new Date(input.to)));
  const rows = await db2.select({
    method: payments.method,
    total: sum(payments.amount),
    count: count(payments.id)
  }).from(payments).where(and(...filters)).groupBy(payments.method).orderBy(payments.method);
  return rows.map((row) => ({
    method: row.method,
    total: String(row.total ?? "0"),
    count: Number(row.count ?? 0)
  }));
}
async function getInventoryMovementSummary(db2, input) {
  const filters = [eq(stockMovements.tenantId, input.tenantId)];
  if (input.branchId) filters.push(eq(stockMovements.branchId, input.branchId));
  if (input.from) filters.push(gte(stockMovements.createdAt, new Date(input.from)));
  if (input.to) filters.push(lte(stockMovements.createdAt, new Date(input.to)));
  const rows = await db2.select({
    type: stockMovements.type,
    totalQty: sum(stockMovements.qty),
    count: count(stockMovements.id)
  }).from(stockMovements).where(and(...filters)).groupBy(stockMovements.type).orderBy(stockMovements.type);
  return rows.map((row) => ({
    type: row.type,
    totalQty: String(row.totalQty ?? "0"),
    count: Number(row.count ?? 0)
  }));
}
async function getProfitLoss(db2, input) {
  const tenantId = input.tenantId;
  const saleFilters = [eq(salesOrders.tenantId, tenantId), inArray(salesOrders.status, ["paid", "partial"])];
  if (input.branchId) saleFilters.push(eq(salesOrders.branchId, input.branchId));
  if (input.from) saleFilters.push(gte(salesOrders.createdAt, new Date(input.from)));
  if (input.to) saleFilters.push(lte(salesOrders.createdAt, new Date(input.to)));
  const [salesRev] = await db2.select({ revenue: sum(salesOrders.grandTotal), orderCount: count(salesOrders.id) }).from(salesOrders).where(and(...saleFilters));
  const svcFilters = [eq(serviceOrders.tenantId, tenantId), inArray(serviceOrders.status, ["completed", "picked_up"])];
  if (input.branchId) svcFilters.push(eq(serviceOrders.branchId, input.branchId));
  if (input.from) svcFilters.push(gte(serviceOrders.date, new Date(input.from)));
  if (input.to) svcFilters.push(lte(serviceOrders.date, new Date(input.to)));
  const [svcRev] = await db2.select({ revenue: sum(serviceOrders.cost), orderCount: count(serviceOrders.id) }).from(serviceOrders).where(and(...svcFilters));
  const cogsFilters = [eq(salesOrders.tenantId, tenantId)];
  if (input.branchId) cogsFilters.push(eq(salesOrders.branchId, input.branchId));
  if (input.from) cogsFilters.push(gte(salesOrders.createdAt, new Date(input.from)));
  if (input.to) cogsFilters.push(lte(salesOrders.createdAt, new Date(input.to)));
  const [cogsRow] = await db2.select({ cogs: sum(sql`${salesOrderItems.qty} * COALESCE(${products.costPrice}, 0)`) }).from(salesOrderItems).innerJoin(salesOrders, eq(salesOrderItems.salesOrderId, salesOrders.id)).leftJoin(products, eq(salesOrderItems.productId, products.id)).where(and(...cogsFilters));
  const cashFilters = [eq(cash.tenantId, tenantId)];
  if (input.branchId) cashFilters.push(eq(cash.branchId, input.branchId));
  if (input.from) cashFilters.push(gte(cash.date, new Date(input.from)));
  if (input.to) cashFilters.push(lte(cash.date, new Date(input.to)));
  const expenseRows = await db2.select({
    category: cashCategories.name,
    total: sum(cash.expense)
  }).from(cash).leftJoin(cashCategories, eq(cash.categoryId, cashCategories.id)).where(and(...cashFilters, eq(cashCategories.type, "expense"), sql`${cash.expense} > 0`)).groupBy(cashCategories.name);
  const [incomeRow] = await db2.select({ total: sum(cash.income) }).from(cash).leftJoin(cashCategories, eq(cash.categoryId, cashCategories.id)).where(and(...cashFilters, eq(cashCategories.type, "income"), sql`${cash.income} > 0`));
  const payFilters = [eq(payments.tenantId, tenantId), eq(payments.status, "success")];
  if (input.branchId) payFilters.push(eq(payments.branchId, input.branchId));
  if (input.from) payFilters.push(gte(payments.createdAt, new Date(input.from)));
  if (input.to) payFilters.push(lte(payments.createdAt, new Date(input.to)));
  const paymentBreakdown = await db2.select({ method: payments.method, total: sum(payments.amount), count: count(payments.id) }).from(payments).where(and(...payFilters)).groupBy(payments.method).orderBy(payments.method);
  const salesRevenue = n(salesRev?.revenue);
  const serviceRevenue = n(svcRev?.revenue);
  const totalRevenue = salesRevenue + serviceRevenue;
  const cogs = n(cogsRow?.cogs);
  const grossProfit = totalRevenue - cogs;
  const totalExpenses = expenseRows.reduce((s, r) => s + n(r.total), 0);
  const otherIncome = n(incomeRow?.total);
  const netProfit = grossProfit - totalExpenses + otherIncome;
  return {
    salesRevenue,
    serviceRevenue,
    totalRevenue,
    salesOrderCount: Number(salesRev?.orderCount ?? 0),
    serviceOrderCount: Number(svcRev?.orderCount ?? 0),
    cogs,
    grossProfit,
    expenses: expenseRows.map((r) => ({ category: r.category ?? "Lainnya", total: n(r.total) })),
    totalExpenses,
    otherIncome,
    netProfit,
    paymentBreakdown: paymentBreakdown.map((r) => ({
      method: r.method,
      total: n(r.total),
      count: Number(r.count ?? 0)
    }))
  };
}
async function getBalanceSheet(db2, input) {
  const tenantId = input.tenantId;
  const cashFilters = [eq(cash.tenantId, tenantId)];
  if (input.branchId) cashFilters.push(eq(cash.branchId, input.branchId));
  if (input.to) cashFilters.push(lte(cash.date, new Date(input.to)));
  const [cashRow] = await db2.select({
    totalIncome: sum(cash.income),
    totalExpense: sum(cash.expense)
  }).from(cash).where(and(...cashFilters));
  const cashOnHand = n(cashRow?.totalIncome) - n(cashRow?.totalExpense);
  const arFilters = [eq(salesOrders.tenantId, tenantId), ne(salesOrders.status, "cancelled")];
  if (input.branchId) arFilters.push(eq(salesOrders.branchId, input.branchId));
  if (input.to) arFilters.push(lte(salesOrders.createdAt, new Date(input.to)));
  const [arRow] = await db2.select({ outstanding: sum(sql`${salesOrders.grandTotal} - ${salesOrders.paidTotal}`) }).from(salesOrders).where(and(...arFilters));
  const accountsReceivable = Math.max(0, n(arRow?.outstanding));
  const invRows = await db2.select({
    productId: stockMovements.productId,
    totalQty: sum(stockMovements.qty)
  }).from(stockMovements).where(eq(stockMovements.tenantId, tenantId)).groupBy(stockMovements.productId);
  const productIds = invRows.map((r) => r.productId);
  const costMap = /* @__PURE__ */ new Map();
  if (productIds.length > 0) {
    const prodRows = await db2.select({ id: products.id, costPrice: products.costPrice }).from(products).where(and(eq(products.tenantId, tenantId), inArray(products.id, productIds)));
    for (const p of prodRows) {
      costMap.set(p.id, n(p.costPrice));
    }
  }
  let inventoryValue = 0;
  const inventoryDetail = invRows.map((r) => {
    const stock = n(r.totalQty);
    const unitCost = costMap.get(r.productId) ?? 0;
    const value = Math.max(0, stock) * unitCost;
    inventoryValue += value;
    return { productId: r.productId, stock: Math.max(0, stock), unitCost, value };
  });
  const totalAssets = cashOnHand + accountsReceivable + inventoryValue;
  const supplierFilters = [eq(suppliers.tenantId, tenantId)];
  const [payableRow] = await db2.select({ total: sum(suppliers.payable) }).from(suppliers).where(and(...supplierFilters));
  const accountsPayable = n(payableRow?.total);
  const totalLiabilities = accountsPayable;
  const allTimeSaleFilters = [eq(salesOrders.tenantId, tenantId), inArray(salesOrders.status, ["paid", "partial"])];
  const [allTimeSalesRev] = await db2.select({ revenue: sum(salesOrders.grandTotal) }).from(salesOrders).where(and(...allTimeSaleFilters));
  const allTimeSvcFilters = [eq(serviceOrders.tenantId, tenantId), inArray(serviceOrders.status, ["completed", "picked_up"])];
  const [allTimeSvcRev] = await db2.select({ revenue: sum(serviceOrders.cost) }).from(serviceOrders).where(and(...allTimeSvcFilters));
  const [allTimeCogs] = await db2.select({ cogs: sum(sql`${salesOrderItems.qty} * COALESCE(${products.costPrice}, 0)`) }).from(salesOrderItems).innerJoin(salesOrders, eq(salesOrderItems.salesOrderId, salesOrders.id)).leftJoin(products, eq(salesOrderItems.productId, products.id)).where(eq(salesOrders.tenantId, tenantId));
  const [allTimeExpense] = await db2.select({ total: sum(cash.expense) }).from(cash).leftJoin(cashCategories, eq(cash.categoryId, cashCategories.id)).where(and(eq(cash.tenantId, tenantId), eq(cashCategories.type, "expense")));
  const [allTimeIncome] = await db2.select({ total: sum(cash.income) }).from(cash).leftJoin(cashCategories, eq(cash.categoryId, cashCategories.id)).where(and(eq(cash.tenantId, tenantId), eq(cashCategories.type, "income")));
  const retainedEarnings = n(allTimeSalesRev?.revenue) + n(allTimeSvcRev?.revenue) - n(allTimeCogs?.cogs) - n(allTimeExpense?.total) + n(allTimeIncome?.total);
  const totalEquity = retainedEarnings;
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
  return {
    assets: {
      cashOnHand,
      accountsReceivable,
      inventoryValue,
      inventoryDetail,
      totalAssets
    },
    liabilities: {
      accountsPayable,
      totalLiabilities
    },
    equity: {
      retainedEarnings,
      totalEquity
    },
    totalLiabilitiesAndEquity
  };
}
async function getSalesReport(db2, input) {
  const tenantId = input.tenantId;
  const saleFilters = [eq(salesOrders.tenantId, tenantId), ne(salesOrders.status, "cancelled")];
  if (input.branchId) saleFilters.push(eq(salesOrders.branchId, input.branchId));
  if (input.from) saleFilters.push(gte(salesOrders.createdAt, new Date(input.from)));
  if (input.to) saleFilters.push(lte(salesOrders.createdAt, new Date(input.to)));
  const dailySales = await db2.select({
    date: sql`DATE(${salesOrders.createdAt})`.as("date"),
    orderCount: count(salesOrders.id),
    revenue: sum(salesOrders.grandTotal),
    paid: sum(salesOrders.paidTotal)
  }).from(salesOrders).where(and(...saleFilters)).groupBy(sql`DATE(${salesOrders.createdAt})`).orderBy(sql`DATE(${salesOrders.createdAt})`);
  const svcFilters = [eq(serviceOrders.tenantId, tenantId), ne(serviceOrders.status, "cancelled")];
  if (input.branchId) svcFilters.push(eq(serviceOrders.branchId, input.branchId));
  if (input.from) svcFilters.push(gte(serviceOrders.date, new Date(input.from)));
  if (input.to) svcFilters.push(lte(serviceOrders.date, new Date(input.to)));
  const dailyService = await db2.select({
    date: sql`DATE(${serviceOrders.date})`.as("date"),
    orderCount: count(serviceOrders.id),
    revenue: sum(serviceOrders.cost)
  }).from(serviceOrders).where(and(...svcFilters)).groupBy(sql`DATE(${serviceOrders.date})`).orderBy(sql`DATE(${serviceOrders.date})`);
  const topProductRows = await db2.select({
    productId: salesOrderItems.productId,
    name: salesOrderItems.name,
    totalQty: sum(salesOrderItems.qty),
    totalRevenue: sum(salesOrderItems.subtotal)
  }).from(salesOrderItems).innerJoin(salesOrders, eq(salesOrderItems.salesOrderId, salesOrders.id)).where(and(...saleFilters)).groupBy(salesOrderItems.productId, salesOrderItems.name).orderBy(desc(sum(salesOrderItems.subtotal))).limit(20);
  const [totals] = await db2.select({
    orderCount: count(salesOrders.id),
    revenue: sum(salesOrders.grandTotal),
    paid: sum(salesOrders.paidTotal)
  }).from(salesOrders).where(and(...saleFilters));
  const [svcTotals] = await db2.select({
    orderCount: count(serviceOrders.id),
    revenue: sum(serviceOrders.cost)
  }).from(serviceOrders).where(and(...svcFilters));
  const totalRevenue = n(totals?.revenue) + n(svcTotals?.revenue);
  const totalOrders = Number(totals?.orderCount ?? 0) + Number(svcTotals?.orderCount ?? 0);
  return {
    summary: {
      totalRevenue,
      salesRevenue: n(totals?.revenue),
      serviceRevenue: n(svcTotals?.revenue),
      totalOrders,
      salesOrders: Number(totals?.orderCount ?? 0),
      serviceOrders: Number(svcTotals?.orderCount ?? 0),
      totalPaid: n(totals?.paid),
      avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0
    },
    dailySales: dailySales.map((r) => ({
      date: r.date,
      orderCount: Number(r.orderCount ?? 0),
      revenue: n(r.revenue),
      paid: n(r.paid)
    })),
    dailyService: dailyService.map((r) => ({
      date: r.date,
      orderCount: Number(r.orderCount ?? 0),
      revenue: n(r.revenue)
    })),
    topProducts: topProductRows.map((r) => ({
      productId: r.productId,
      name: r.name,
      totalQty: n(r.totalQty),
      totalRevenue: n(r.totalRevenue)
    }))
  };
}
async function getPaymentReport(db2, input) {
  const tenantId = input.tenantId;
  const payFilters = [eq(payments.tenantId, tenantId), eq(payments.status, "success")];
  if (input.branchId) payFilters.push(eq(payments.branchId, input.branchId));
  if (input.from) payFilters.push(gte(payments.createdAt, new Date(input.from)));
  if (input.to) payFilters.push(lte(payments.createdAt, new Date(input.to)));
  const byMethod = await db2.select({ method: payments.method, total: sum(payments.amount), count: count(payments.id) }).from(payments).where(and(...payFilters)).groupBy(payments.method).orderBy(payments.method);
  const bySource = await db2.select({ source: payments.source, total: sum(payments.amount), count: count(payments.id) }).from(payments).where(and(...payFilters)).groupBy(payments.source).orderBy(payments.source);
  const dailyFlow = await db2.select({
    date: sql`DATE(${payments.createdAt})`.as("date"),
    method: payments.method,
    total: sum(payments.amount)
  }).from(payments).where(and(...payFilters)).groupBy(sql`DATE(${payments.createdAt})`, payments.method).orderBy(sql`DATE(${payments.createdAt})`);
  const arFilters = [eq(salesOrders.tenantId, tenantId), ne(salesOrders.status, "cancelled"), sql`${salesOrders.grandTotal} > ${salesOrders.paidTotal}`];
  if (input.branchId) arFilters.push(eq(salesOrders.branchId, input.branchId));
  const receivables = await db2.select({
    id: salesOrders.id,
    orderNumber: salesOrders.orderNumber,
    grandTotal: salesOrders.grandTotal,
    paidTotal: salesOrders.paidTotal,
    outstanding: sql`${salesOrders.grandTotal} - ${salesOrders.paidTotal}`,
    createdAt: salesOrders.createdAt
  }).from(salesOrders).where(and(...arFilters)).orderBy(salesOrders.createdAt).limit(50);
  const now = /* @__PURE__ */ new Date();
  const aging = { current: 0, days7: 0, days30: 0, days60: 0, over60: 0 };
  for (const r of receivables) {
    const days = Math.floor((now.getTime() - new Date(r.createdAt).getTime()) / 864e5);
    const amount = n(r.outstanding);
    if (days <= 7) aging.current += amount;
    else if (days <= 30) aging.days7 += amount;
    else if (days <= 60) aging.days30 += amount;
    else aging.over60 += amount;
  }
  const totalCollected = byMethod.reduce((s, r) => s + n(r.total), 0);
  const totalReceivable = receivables.reduce((s, r) => s + n(r.outstanding), 0);
  return {
    summary: {
      totalCollected,
      totalReceivable,
      transactionCount: byMethod.reduce((s, r) => s + Number(r.count ?? 0), 0)
    },
    byMethod: byMethod.map((r) => ({ method: r.method, total: n(r.total), count: Number(r.count ?? 0) })),
    bySource: bySource.map((r) => ({ source: r.source ?? "Unknown", total: n(r.total), count: Number(r.count ?? 0) })),
    dailyFlow: dailyFlow.map((r) => ({ date: r.date, method: r.method, total: n(r.total) })),
    aging,
    receivables: receivables.map((r) => ({
      id: r.id,
      orderNumber: r.orderNumber,
      grandTotal: n(r.grandTotal),
      paidTotal: n(r.paidTotal),
      outstanding: n(r.outstanding),
      createdAt: r.createdAt.toISOString()
    }))
  };
}
async function getInventoryReport(db2, input) {
  const tenantId = input.tenantId;
  const prodRows = await db2.select({
    id: products.id,
    name: products.name,
    sku: products.sku,
    type: products.type,
    costPrice: products.costPrice,
    salePrice: products.salePrice,
    minimumStock: products.minimumStock,
    isActive: products.isActive
  }).from(products).where(and(eq(products.tenantId, tenantId), eq(products.isActive, true)));
  const movementTotals = await db2.select({
    productId: stockMovements.productId,
    totalQty: sum(stockMovements.qty)
  }).from(stockMovements).where(eq(stockMovements.tenantId, tenantId)).groupBy(stockMovements.productId);
  const stockMap = new Map(movementTotals.map((r) => [r.productId, Math.max(0, n(r.totalQty))]));
  const valuation = prodRows.map((p) => {
    const stock = stockMap.get(p.id) ?? 0;
    const unitCost = n(p.costPrice);
    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      type: p.type,
      stock,
      unitCost,
      unitPrice: n(p.salePrice),
      value: stock * unitCost,
      minimumStock: p.minimumStock,
      isLow: stock <= p.minimumStock
    };
  });
  const movFilters = [eq(stockMovements.tenantId, tenantId)];
  if (input.branchId) movFilters.push(eq(stockMovements.branchId, input.branchId));
  if (input.from) movFilters.push(gte(stockMovements.createdAt, new Date(input.from)));
  if (input.to) movFilters.push(lte(stockMovements.createdAt, new Date(input.to)));
  const movementSummary = await db2.select({
    type: stockMovements.type,
    totalQty: sum(sql`ABS(${stockMovements.qty})`),
    count: count(stockMovements.id)
  }).from(stockMovements).where(and(...movFilters)).groupBy(stockMovements.type).orderBy(stockMovements.type);
  const movementDetail = await db2.select({
    id: stockMovements.id,
    productName: products.name,
    type: stockMovements.type,
    qty: stockMovements.qty,
    referenceType: stockMovements.referenceType,
    notes: stockMovements.notes,
    createdAt: stockMovements.createdAt
  }).from(stockMovements).leftJoin(products, eq(stockMovements.productId, products.id)).where(and(...movFilters)).orderBy(desc(stockMovements.createdAt)).limit(200);
  const totalSkus = valuation.length;
  const totalValue = valuation.reduce((s, v) => s + v.value, 0);
  const lowStockCount = valuation.filter((v) => v.isLow).length;
  return {
    summary: {
      totalSkus,
      totalValue,
      lowStockCount
    },
    valuation,
    movementSummary: movementSummary.map((r) => ({
      type: r.type,
      totalQty: n(r.totalQty),
      count: Number(r.count ?? 0)
    })),
    movementDetail: movementDetail.map((r) => ({
      id: r.id,
      productName: r.productName ?? "Unknown",
      type: r.type,
      qty: n(r.qty),
      referenceType: r.referenceType,
      notes: r.notes,
      createdAt: r.createdAt.toISOString()
    })),
    lowStock: valuation.filter((v) => v.isLow)
  };
}

// src/features/reports/routes.ts
var reportRoutes = new Hono3();
function getInput(c) {
  return {
    tenantId: c.req.query("tenantId") ?? "",
    branchId: c.req.query("branchId") ?? void 0,
    from: c.req.query("from") ?? void 0,
    to: c.req.query("to") ?? void 0
  };
}
reportRoutes.get("/sales/summary", async (c) => {
  const input = getInput(c);
  if (!input.tenantId) return c.json({ ok: false, message: "tenantId required" }, 400);
  const summary = await getSalesSummary(db, input);
  return c.json({ ok: true, summary });
});
reportRoutes.get("/payments/summary", async (c) => {
  const input = getInput(c);
  if (!input.tenantId) return c.json({ ok: false, message: "tenantId required" }, 400);
  const items = await getPaymentSummary(db, input);
  return c.json({ ok: true, items });
});
reportRoutes.get("/inventory/movements", async (c) => {
  const input = getInput(c);
  if (!input.tenantId) return c.json({ ok: false, message: "tenantId required" }, 400);
  const items = await getInventoryMovementSummary(db, input);
  return c.json({ ok: true, items });
});
reportRoutes.get("/profit-loss", async (c) => {
  const input = getInput(c);
  if (!input.tenantId) return c.json({ ok: false, message: "tenantId required" }, 400);
  const data = await getProfitLoss(db, input);
  return c.json({ ok: true, data });
});
reportRoutes.get("/balance-sheet", async (c) => {
  const input = getInput(c);
  if (!input.tenantId) return c.json({ ok: false, message: "tenantId required" }, 400);
  const data = await getBalanceSheet(db, input);
  return c.json({ ok: true, data });
});
reportRoutes.get("/sales", async (c) => {
  const input = getInput(c);
  if (!input.tenantId) return c.json({ ok: false, message: "tenantId required" }, 400);
  const data = await getSalesReport(db, input);
  return c.json({ ok: true, data });
});
reportRoutes.get("/payments", async (c) => {
  const input = getInput(c);
  if (!input.tenantId) return c.json({ ok: false, message: "tenantId required" }, 400);
  const data = await getPaymentReport(db, input);
  return c.json({ ok: true, data });
});
reportRoutes.get("/inventory", async (c) => {
  const input = getInput(c);
  if (!input.tenantId) return c.json({ ok: false, message: "tenantId required" }, 400);
  const data = await getInventoryReport(db, input);
  return c.json({ ok: true, data });
});

// src/features/sync/routes.ts
import { Hono as Hono4 } from "hono";

// src/features/auth/middleware.ts
async function authMiddleware(c, next) {
  const userId = readUserId(c.req.raw);
  if (!userId) {
    return c.json({ ok: false, message: "Authentication required" }, 401);
  }
  c.set("userId", userId);
  await next();
}

// ../../packages/shared-contracts/src/sync/api.ts
function buildSyncPushResponse(items) {
  return {
    ok: true,
    summary: {
      total: items.length,
      applied: items.filter((item) => item.status === "applied").length,
      conflict: items.filter((item) => item.status === "conflict").length,
      rejected: items.filter((item) => item.status === "rejected").length
    },
    items
  };
}

// ../../packages/shared-contracts/src/sync/mappers.ts
function serverSyncStatusToApiItemStatus(status) {
  if (status === "pending") return "pending";
  if (status === "synced") return "applied";
  if (status === "conflict") return "conflict";
  return "rejected";
}

// ../../packages/shared-contracts/src/sync/validation.ts
var syncEntityTypes = /* @__PURE__ */ new Set(["product", "customer", "sale", "payment", "stock_movement", "cash", "cash_category", "setting", "shift", "product_category", "supplier", "purchase", "return", "service_order", "payment_method", "recipe"]);
var syncMutationTypes = /* @__PURE__ */ new Set(["create", "update", "delete"]);
var uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isUuid(value) {
  return typeof value === "string" && uuidPattern.test(value);
}
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function readOptionalUuid(value) {
  if (value === void 0) return void 0;
  if (value === null) return null;
  if (!isUuid(value)) return void 0;
  return value;
}
function parseSyncPullQuery(input) {
  if (!isUuid(input.tenantId)) {
    return { ok: false, message: "tenantId required" };
  }
  const branchId = readOptionalUuid(input.branchId);
  if (input.branchId !== void 0 && branchId === void 0) {
    return { ok: false, message: "branchId invalid" };
  }
  let since;
  if (input.since) {
    since = new Date(input.since);
    if (Number.isNaN(since.getTime())) {
      return { ok: false, message: "since invalid" };
    }
  }
  return {
    ok: true,
    value: {
      tenantId: input.tenantId,
      branchId: branchId ?? void 0,
      since
    }
  };
}
function parseSyncPushBody(input) {
  if (!isRecord(input)) {
    return { ok: false, message: "body invalid" };
  }
  if (!isUuid(input.tenantId)) {
    return { ok: false, message: "tenantId required" };
  }
  const branchId = readOptionalUuid(input.branchId);
  if (input.branchId !== void 0 && input.branchId !== null && branchId === void 0) {
    return { ok: false, message: "branchId invalid" };
  }
  if (typeof input.deviceId !== "string" || input.deviceId.trim().length === 0) {
    return { ok: false, message: "deviceId required" };
  }
  if (!Array.isArray(input.mutations) || input.mutations.length === 0) {
    return { ok: false, message: "mutations required" };
  }
  const mutations = [];
  for (const mutation of input.mutations) {
    if (!isRecord(mutation)) {
      return { ok: false, message: "mutations invalid" };
    }
    if (!isUuid(mutation.entityId)) {
      return { ok: false, message: "mutations entityId invalid" };
    }
    if (!syncEntityTypes.has(mutation.entityType)) {
      return { ok: false, message: "mutations entityType invalid" };
    }
    if (!syncMutationTypes.has(mutation.mutationType)) {
      return { ok: false, message: "mutations mutationType invalid" };
    }
    if (mutation.clientMutationId !== void 0 && typeof mutation.clientMutationId !== "string") {
      return { ok: false, message: "mutations clientMutationId invalid" };
    }
    if (mutation.status !== void 0 && mutation.status !== "queued" && mutation.status !== "syncing" && mutation.status !== "synced" && mutation.status !== "failed" && mutation.status !== "conflict") {
      return { ok: false, message: "mutations status invalid" };
    }
    mutations.push({
      entityId: mutation.entityId,
      entityType: mutation.entityType,
      mutationType: mutation.mutationType,
      clientMutationId: mutation.clientMutationId,
      payload: mutation.payload,
      status: mutation.status
    });
  }
  return {
    ok: true,
    value: {
      tenantId: input.tenantId,
      branchId: branchId ?? null,
      deviceId: input.deviceId.trim(),
      mutations
    }
  };
}

// src/features/sync/apply.ts
function toNumeric(value) {
  if (value === void 0 || value === null) return "0";
  if (typeof value === "number") return String(value);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(parsed) : "0";
}
function toNullableUuid(value) {
  return typeof value === "string" && value.length > 0 ? value : null;
}
function mapClientProductType(value) {
  if (value === "Jasa" || value === "service") return "service";
  return "physical";
}
function mapClientProductStatus(value) {
  if (value === "Arsip" || value === false) return false;
  return true;
}
function mapClientPaymentMethod(value) {
  if (value === "tunai" || value === "cash") return "cash";
  if (value === "qris") return "qris";
  if (value === "kartu" || value === "card") return "card";
  if (value === "transfer") return "transfer";
  if (value === "e-wallet" || value === "ewallet") return "ewallet";
  if (value === "piutang" || value === "receivable") return "receivable";
  return "cash";
}
function mapClientPaymentStatus(value) {
  if (value === "Berhasil" || value === "success") return "success";
  if (value === "Pending" || value === "pending") return "pending";
  if (value === "Gagal" || value === "failed") return "failed";
  if (value === "Refund" || value === "refunded") return "refunded";
  return "pending";
}
function mapClientSalesOrderStatus(value) {
  if (value === "Draft" || value === "draft") return "draft";
  if (value === "Lunas" || value === "paid") return "paid";
  if (value === "Sebagian" || value === "partial") return "partial";
  if (value === "Belum Bayar" || value === "unpaid") return "unpaid";
  if (value === "Batal" || value === "cancelled") return "cancelled";
  if (value === "Piutang" || value === "receivable") return "receivable";
  return "draft";
}
function mapClientStockMovementType(value) {
  const allowed = /* @__PURE__ */ new Set(["sale", "purchase", "return", "adjustment", "transfer_in", "transfer_out", "damage_lost"]);
  if (typeof value === "string" && allowed.has(value)) return value;
  return "adjustment";
}
async function applyProduct(db2, ctx, entityId, mutationType, payload) {
  if (mutationType === "delete") {
    await db2.update(products).set({ deletedAt: /* @__PURE__ */ new Date() }).where(eq(products.id, entityId));
    return;
  }
  const now = /* @__PURE__ */ new Date();
  await db2.insert(products).values({
    id: entityId,
    tenantId: ctx.tenantId,
    branchId: toNullableUuid(ctx.branchId),
    name: payload.name ?? "",
    sku: payload.sku ?? null,
    barcode: payload.barcode ?? null,
    type: mapClientProductType(payload.type),
    salePrice: toNumeric(payload.price),
    costPrice: null,
    wholesalePrice: null,
    minimumStock: 0,
    imageUrl: null,
    isActive: mapClientProductStatus(payload.status ?? payload.isActive),
    syncStatus: "synced",
    version: 1,
    createdAt: now,
    updatedAt: now
  }).onConflictDoUpdate({
    target: products.id,
    set: {
      name: payload.name ?? "",
      sku: payload.sku ?? null,
      barcode: payload.barcode ?? null,
      type: mapClientProductType(payload.type),
      salePrice: toNumeric(payload.price),
      isActive: mapClientProductStatus(payload.status ?? payload.isActive),
      syncStatus: "synced",
      updatedAt: now
    }
  });
}
async function applySale(db2, ctx, entityId, mutationType, payload) {
  if (!ctx.branchId) {
    throw new Error("branchId required for sale mutation");
  }
  const now = /* @__PURE__ */ new Date();
  if (mutationType === "delete") {
    await db2.delete(salesOrderItems).where(eq(salesOrderItems.salesOrderId, entityId));
    await db2.delete(salesOrders).where(eq(salesOrders.id, entityId));
    return;
  }
  await db2.insert(salesOrders).values({
    id: entityId,
    tenantId: ctx.tenantId,
    branchId: ctx.branchId,
    customerId: toNullableUuid(payload.customerId),
    orderNumber: payload.orderNumber ?? payload.code ?? entityId,
    status: mapClientSalesOrderStatus(payload.status),
    subtotal: toNumeric(payload.subtotal),
    discountTotal: toNumeric(payload.discountTotal),
    taxTotal: toNumeric(payload.taxTotal),
    grandTotal: toNumeric(payload.grandTotal),
    paidTotal: toNumeric(payload.paidTotal),
    notes: null,
    syncStatus: "synced",
    version: 1,
    createdAt: now,
    updatedAt: now
  }).onConflictDoUpdate({
    target: salesOrders.id,
    set: {
      status: mapClientSalesOrderStatus(payload.status),
      subtotal: toNumeric(payload.subtotal),
      discountTotal: toNumeric(payload.discountTotal),
      taxTotal: toNumeric(payload.taxTotal),
      grandTotal: toNumeric(payload.grandTotal),
      paidTotal: toNumeric(payload.paidTotal),
      syncStatus: "synced",
      updatedAt: now
    }
  });
  if (Array.isArray(payload.items)) {
    await db2.delete(salesOrderItems).where(eq(salesOrderItems.salesOrderId, entityId));
    if (payload.items.length > 0) {
      await db2.insert(salesOrderItems).values(
        payload.items.map((item) => ({
          id: item.id ?? crypto.randomUUID(),
          tenantId: ctx.tenantId,
          salesOrderId: entityId,
          productId: toNullableUuid(item.productId),
          name: item.name ?? "",
          qty: toNumeric(item.qty),
          unitPrice: toNumeric(item.unitPrice),
          discountTotal: "0",
          subtotal: toNumeric(item.subtotal),
          createdAt: now,
          updatedAt: now
        }))
      );
    }
  }
}
async function applyPayment(db2, ctx, entityId, mutationType, payload) {
  if (!ctx.branchId) {
    throw new Error("branchId required for payment mutation");
  }
  if (mutationType === "delete") {
    await db2.delete(payments).where(eq(payments.id, entityId));
    return;
  }
  const now = /* @__PURE__ */ new Date();
  await db2.insert(payments).values({
    id: entityId,
    tenantId: ctx.tenantId,
    branchId: ctx.branchId,
    salesOrderId: toNullableUuid(payload.salesOrderId),
    serviceOrderId: toNullableUuid(payload.serviceOrderId),
    purchaseId: toNullableUuid(payload.purchaseId),
    paymentNumber: payload.paymentNumber ?? payload.ref ?? entityId,
    source: payload.source ?? null,
    method: mapClientPaymentMethod(payload.method),
    amount: toNumeric(payload.amount),
    referenceNumber: null,
    status: mapClientPaymentStatus(payload.status),
    syncStatus: "synced",
    createdAt: now,
    updatedAt: now
  }).onConflictDoUpdate({
    target: payments.id,
    set: {
      status: mapClientPaymentStatus(payload.status),
      amount: toNumeric(payload.amount),
      source: payload.source ?? void 0,
      syncStatus: "synced",
      updatedAt: now
    }
  });
}
async function applyStockMovement(db2, ctx, entityId, mutationType, payload) {
  if (!payload.productId) {
    throw new Error("productId required for stock_movement mutation");
  }
  if (mutationType === "delete") {
    await db2.delete(stockMovements).where(eq(stockMovements.id, entityId));
    return;
  }
  const now = /* @__PURE__ */ new Date();
  await db2.insert(stockMovements).values({
    id: entityId,
    tenantId: ctx.tenantId,
    branchId: toNullableUuid(ctx.branchId),
    warehouseId: ctx.branchId ?? "",
    productId: payload.productId,
    type: mapClientStockMovementType(payload.type),
    qty: toNumeric(payload.qty),
    referenceType: payload.referenceType ?? null,
    referenceId: toNullableUuid(payload.referenceId),
    notes: payload.notes ?? null,
    syncStatus: "synced",
    createdAt: now,
    updatedAt: now
  }).onConflictDoUpdate({
    target: stockMovements.id,
    set: {
      qty: toNumeric(payload.qty),
      syncStatus: "synced",
      updatedAt: now
    }
  });
}
function mapClientCustomerStatus(value) {
  if (value === "Nonaktif" || value === false) return false;
  return true;
}
function mapClientCategoryStatus(value) {
  if (value === "Arsip" || value === "Nonaktif" || value === false) return false;
  return true;
}
function mapClientCashCategoryType(value) {
  if (value === "Pemasukan" || value === "income") return "income";
  return "expense";
}
function mapClientShiftStatus(value) {
  if (value === "closed" || value === "tutup") return "closed";
  return "open";
}
function mapClientPurchaseStatus(value) {
  if (value === "Draft" || value === "draft") return "draft";
  if (value === "Dikirim" || value === "shipped") return "shipped";
  if (value === "Diterima" || value === "received") return "received";
  if (value === "Batal" || value === "cancelled") return "cancelled";
  return "draft";
}
function mapClientReturnType(value) {
  if (value === "Pembelian" || value === "purchase") return "purchase";
  return "sale";
}
function mapClientReturnStatus(value) {
  if (value === "Draft" || value === "draft") return "draft";
  if (value === "Diproses" || value === "processing") return "processing";
  if (value === "Selesai" || value === "completed") return "completed";
  if (value === "Batal" || value === "cancelled") return "cancelled";
  return "draft";
}
function mapClientServiceOrderStatus(value) {
  if (value === "Diterima" || value === "received") return "received";
  if (value === "Dikerjakan" || value === "in_progress") return "in_progress";
  if (value === "Selesai" || value === "completed") return "completed";
  if (value === "Diambil" || value === "picked_up") return "picked_up";
  if (value === "Batal" || value === "cancelled") return "cancelled";
  return "received";
}
async function applyCustomer(db2, ctx, entityId, mutationType, payload) {
  if (mutationType === "delete") {
    await db2.update(customers).set({ deletedAt: /* @__PURE__ */ new Date() }).where(eq(customers.id, entityId));
    return;
  }
  const now = /* @__PURE__ */ new Date();
  await db2.insert(customers).values({
    id: entityId,
    tenantId: ctx.tenantId,
    branchId: toNullableUuid(ctx.branchId),
    name: payload.name ?? "",
    phone: payload.phone ?? null,
    email: payload.email ?? null,
    address: payload.city ?? null,
    notes: null,
    isActive: mapClientCustomerStatus(payload.status ?? payload.isActive),
    syncStatus: "synced",
    version: 1,
    createdAt: now,
    updatedAt: now
  }).onConflictDoUpdate({
    target: customers.id,
    set: {
      name: payload.name ?? "",
      phone: payload.phone ?? null,
      email: payload.email ?? null,
      address: payload.city ?? null,
      isActive: mapClientCustomerStatus(payload.status ?? payload.isActive),
      syncStatus: "synced",
      updatedAt: now
    }
  });
}
async function applyProductCategory(db2, ctx, entityId, mutationType, payload) {
  if (mutationType === "delete") {
    await db2.update(productCategories).set({ deletedAt: /* @__PURE__ */ new Date() }).where(eq(productCategories.id, entityId));
    return;
  }
  const now = /* @__PURE__ */ new Date();
  await db2.insert(productCategories).values({
    id: entityId,
    tenantId: ctx.tenantId,
    name: payload.name ?? "",
    isActive: mapClientCategoryStatus(payload.status ?? payload.isActive),
    syncStatus: "synced",
    version: 1,
    createdAt: now,
    updatedAt: now
  }).onConflictDoUpdate({
    target: productCategories.id,
    set: {
      name: payload.name ?? "",
      isActive: mapClientCategoryStatus(payload.status ?? payload.isActive),
      syncStatus: "synced",
      updatedAt: now
    }
  });
}
async function applyCashCategory(db2, ctx, entityId, mutationType, payload) {
  if (mutationType === "delete") {
    await db2.update(cashCategories).set({ deletedAt: /* @__PURE__ */ new Date() }).where(eq(cashCategories.id, entityId));
    return;
  }
  const now = /* @__PURE__ */ new Date();
  await db2.insert(cashCategories).values({
    id: entityId,
    tenantId: ctx.tenantId,
    name: payload.name ?? "",
    type: mapClientCashCategoryType(payload.type),
    isActive: mapClientCategoryStatus(payload.status ?? payload.isActive),
    syncStatus: "synced",
    version: 1,
    createdAt: now,
    updatedAt: now
  }).onConflictDoUpdate({
    target: cashCategories.id,
    set: {
      name: payload.name ?? "",
      type: mapClientCashCategoryType(payload.type),
      isActive: mapClientCategoryStatus(payload.status ?? payload.isActive),
      syncStatus: "synced",
      updatedAt: now
    }
  });
}
async function applyCash(db2, ctx, entityId, mutationType, payload) {
  if (mutationType === "delete") {
    await db2.delete(cash).where(eq(cash.id, entityId));
    return;
  }
  const now = /* @__PURE__ */ new Date();
  await db2.insert(cash).values({
    id: entityId,
    tenantId: ctx.tenantId,
    branchId: toNullableUuid(ctx.branchId),
    ref: payload.ref ?? payload.id ?? entityId,
    date: payload.date ? new Date(payload.date) : now,
    categoryId: toNullableUuid(payload.categoryId ?? payload.category),
    income: toNumeric(payload.income),
    expense: toNumeric(payload.expense),
    status: payload.status ?? "posted",
    syncStatus: "synced",
    createdAt: now,
    updatedAt: now
  }).onConflictDoUpdate({
    target: cash.id,
    set: {
      income: toNumeric(payload.income),
      expense: toNumeric(payload.expense),
      status: payload.status ?? "posted",
      syncStatus: "synced",
      updatedAt: now
    }
  });
}
async function applySetting(db2, ctx, entityId, mutationType, payload) {
  if (mutationType === "delete") {
    await db2.delete(settings).where(eq(settings.id, entityId));
    return;
  }
  const now = /* @__PURE__ */ new Date();
  const settingKey = payload.key ?? payload.setting ?? entityId;
  const area = payload.area ?? "general";
  const existing = await db2.query.settings.findFirst({
    where: and(eq(settings.tenantId, ctx.tenantId), eq(settings.key, settingKey))
  });
  if (existing) {
    await db2.update(settings).set({
      value: payload.value ?? "",
      area,
      status: payload.status ?? "active",
      syncStatus: "synced",
      updatedAt: now
    }).where(eq(settings.id, existing.id));
  } else {
    const uuid2 = /^[0-9a-f]{8}-/i.test(entityId) ? entityId : crypto.randomUUID();
    await db2.insert(settings).values({
      id: uuid2,
      tenantId: ctx.tenantId,
      key: settingKey,
      area,
      value: payload.value ?? "",
      status: payload.status ?? "active",
      syncStatus: "synced",
      createdAt: now,
      updatedAt: now
    });
  }
}
async function applyShift(db2, ctx, entityId, mutationType, payload) {
  if (mutationType === "delete") {
    await db2.delete(shifts).where(eq(shifts.id, entityId));
    return;
  }
  const now = /* @__PURE__ */ new Date();
  await db2.insert(shifts).values({
    id: entityId,
    tenantId: ctx.tenantId,
    branchId: toNullableUuid(ctx.branchId),
    cashierName: payload.cashierName ?? "",
    startTime: payload.startTime ? new Date(payload.startTime) : now,
    endTime: payload.endTime ? new Date(payload.endTime) : null,
    startCash: toNumeric(payload.startCash),
    expectedCash: payload.expectedCash !== void 0 ? toNumeric(payload.expectedCash) : null,
    actualCash: payload.actualCash !== void 0 ? toNumeric(payload.actualCash) : null,
    difference: payload.difference !== void 0 ? toNumeric(payload.difference) : null,
    status: mapClientShiftStatus(payload.status),
    syncStatus: "synced",
    createdAt: now,
    updatedAt: now
  }).onConflictDoUpdate({
    target: shifts.id,
    set: {
      endTime: payload.endTime ? new Date(payload.endTime) : null,
      expectedCash: payload.expectedCash !== void 0 ? toNumeric(payload.expectedCash) : void 0,
      actualCash: payload.actualCash !== void 0 ? toNumeric(payload.actualCash) : void 0,
      difference: payload.difference !== void 0 ? toNumeric(payload.difference) : void 0,
      status: mapClientShiftStatus(payload.status),
      syncStatus: "synced",
      updatedAt: now
    }
  });
}
async function applySupplier(db2, ctx, entityId, mutationType, payload) {
  if (mutationType === "delete") {
    await db2.update(suppliers).set({ deletedAt: /* @__PURE__ */ new Date() }).where(eq(suppliers.id, entityId));
    return;
  }
  const now = /* @__PURE__ */ new Date();
  await db2.insert(suppliers).values({
    id: entityId,
    tenantId: ctx.tenantId,
    name: payload.name ?? "",
    phone: payload.phone ?? null,
    city: payload.city ?? null,
    payable: toNumeric(payload.payable),
    orders: payload.orders ?? 0,
    isActive: mapClientCustomerStatus(payload.status ?? payload.isActive),
    syncStatus: "synced",
    version: 1,
    createdAt: now,
    updatedAt: now
  }).onConflictDoUpdate({
    target: suppliers.id,
    set: {
      name: payload.name ?? "",
      phone: payload.phone ?? null,
      city: payload.city ?? null,
      payable: toNumeric(payload.payable),
      orders: payload.orders ?? 0,
      isActive: mapClientCustomerStatus(payload.status ?? payload.isActive),
      syncStatus: "synced",
      updatedAt: now
    }
  });
}
async function applyPurchase(db2, ctx, entityId, mutationType, payload) {
  if (mutationType === "delete") {
    await db2.delete(purchaseItems).where(eq(purchaseItems.purchaseId, entityId));
    await db2.delete(purchases).where(eq(purchases.id, entityId));
    return;
  }
  const now = /* @__PURE__ */ new Date();
  await db2.insert(purchases).values({
    id: entityId,
    tenantId: ctx.tenantId,
    branchId: toNullableUuid(ctx.branchId),
    supplierId: toNullableUuid(payload.supplierId),
    code: payload.code ?? entityId,
    date: payload.date ? new Date(payload.date) : now,
    subtotal: toNumeric(payload.subtotal),
    grandTotal: toNumeric(payload.grandTotal),
    status: mapClientPurchaseStatus(payload.status),
    syncStatus: "synced",
    version: 1,
    createdAt: now,
    updatedAt: now
  }).onConflictDoUpdate({
    target: purchases.id,
    set: {
      subtotal: toNumeric(payload.subtotal),
      grandTotal: toNumeric(payload.grandTotal),
      status: mapClientPurchaseStatus(payload.status),
      syncStatus: "synced",
      updatedAt: now
    }
  });
  if (Array.isArray(payload.items)) {
    await db2.delete(purchaseItems).where(eq(purchaseItems.purchaseId, entityId));
    if (payload.items.length > 0) {
      await db2.insert(purchaseItems).values(
        payload.items.map((item) => ({
          id: item.id ?? crypto.randomUUID(),
          tenantId: ctx.tenantId,
          purchaseId: entityId,
          productId: toNullableUuid(item.productId),
          name: item.name ?? "",
          qty: toNumeric(item.qty),
          unitPrice: toNumeric(item.unitPrice),
          subtotal: toNumeric(item.subtotal),
          createdAt: now,
          updatedAt: now
        }))
      );
    }
  }
}
async function applyReturn(db2, ctx, entityId, mutationType, payload) {
  if (mutationType === "delete") {
    await db2.delete(returnItems).where(eq(returnItems.returnId, entityId));
    await db2.delete(returns).where(eq(returns.id, entityId));
    return;
  }
  const now = /* @__PURE__ */ new Date();
  await db2.insert(returns).values({
    id: entityId,
    tenantId: ctx.tenantId,
    branchId: toNullableUuid(ctx.branchId),
    code: payload.code ?? entityId,
    type: mapClientReturnType(payload.type),
    referenceCode: payload.referenceCode ?? "",
    date: payload.date ? new Date(payload.date) : now,
    total: toNumeric(payload.total),
    status: mapClientReturnStatus(payload.status),
    syncStatus: "synced",
    version: 1,
    createdAt: now,
    updatedAt: now
  }).onConflictDoUpdate({
    target: returns.id,
    set: {
      total: toNumeric(payload.total),
      status: mapClientReturnStatus(payload.status),
      syncStatus: "synced",
      updatedAt: now
    }
  });
  if (Array.isArray(payload.items)) {
    await db2.delete(returnItems).where(eq(returnItems.returnId, entityId));
    if (payload.items.length > 0) {
      await db2.insert(returnItems).values(
        payload.items.map((item) => ({
          id: item.id ?? crypto.randomUUID(),
          tenantId: ctx.tenantId,
          returnId: entityId,
          productId: toNullableUuid(item.productId),
          name: item.name ?? "",
          qty: toNumeric(item.qty),
          unitPrice: toNumeric(item.unitPrice),
          subtotal: toNumeric(item.subtotal),
          createdAt: now,
          updatedAt: now
        }))
      );
    }
  }
}
async function applyServiceOrder(db2, ctx, entityId, mutationType, payload) {
  if (mutationType === "delete") {
    await db2.delete(serviceOrders).where(eq(serviceOrders.id, entityId));
    return;
  }
  const now = /* @__PURE__ */ new Date();
  await db2.insert(serviceOrders).values({
    id: entityId,
    tenantId: ctx.tenantId,
    branchId: toNullableUuid(ctx.branchId),
    customerId: toNullableUuid(payload.customerId),
    code: payload.code ?? entityId,
    customerName: payload.customerName ?? "",
    description: payload.description ?? null,
    date: payload.date ? new Date(payload.date) : now,
    cost: toNumeric(payload.cost),
    paidTotal: toNumeric(payload.paidTotal),
    status: mapClientServiceOrderStatus(payload.status),
    syncStatus: "synced",
    version: 1,
    createdAt: now,
    updatedAt: now
  }).onConflictDoUpdate({
    target: serviceOrders.id,
    set: {
      customerName: payload.customerName ?? "",
      description: payload.description ?? null,
      cost: toNumeric(payload.cost),
      paidTotal: toNumeric(payload.paidTotal),
      status: mapClientServiceOrderStatus(payload.status),
      syncStatus: "synced",
      updatedAt: now
    }
  });
}
async function applyPaymentMethod(db2, ctx, entityId, mutationType, payload) {
  if (mutationType === "delete") {
    await db2.delete(paymentMethods).where(eq(paymentMethods.id, entityId));
    return;
  }
  const now = /* @__PURE__ */ new Date();
  await db2.insert(paymentMethods).values({
    id: entityId,
    tenantId: ctx.tenantId,
    name: payload.name ?? "",
    provider: payload.provider ?? "",
    type: payload.type ?? "",
    accountNumber: payload.accountNumber ?? null,
    accountName: payload.accountName ?? null,
    status: payload.status === "Tidak Aktif" ? "inactive" : "active",
    createdAt: now,
    updatedAt: now
  }).onConflictDoUpdate({
    target: paymentMethods.id,
    set: {
      name: payload.name ?? "",
      provider: payload.provider ?? "",
      type: payload.type ?? "",
      accountNumber: payload.accountNumber ?? null,
      accountName: payload.accountName ?? null,
      status: payload.status === "Tidak Aktif" ? "inactive" : "active",
      updatedAt: now
    }
  });
}
async function applyRecipe(db2, ctx, entityId, mutationType, payload) {
  if (mutationType === "delete") {
    await db2.delete(recipes).where(eq(recipes.id, entityId));
    return;
  }
  const now = /* @__PURE__ */ new Date();
  await db2.insert(recipes).values({
    id: entityId,
    tenantId: ctx.tenantId,
    productId: payload.productId ?? entityId,
    productName: payload.productName ?? "",
    name: payload.name ?? "",
    batchYield: payload.batchYield ?? 1,
    items: payload.items ?? [],
    status: payload.status === "Aktif" ? "active" : "draft",
    createdAt: now,
    updatedAt: now
  }).onConflictDoUpdate({
    target: recipes.id,
    set: {
      productId: payload.productId ?? entityId,
      productName: payload.productName ?? "",
      name: payload.name ?? "",
      batchYield: payload.batchYield ?? 1,
      items: payload.items ?? [],
      status: payload.status === "Aktif" ? "active" : "draft",
      updatedAt: now
    }
  });
}
async function applyMutation(db2, ctx, entityType, entityId, mutationType, payload) {
  if (entityType === "product") {
    await applyProduct(db2, ctx, entityId, mutationType, payload ?? {});
    return;
  }
  if (entityType === "sale") {
    await applySale(db2, ctx, entityId, mutationType, payload ?? {});
    return;
  }
  if (entityType === "payment") {
    await applyPayment(db2, ctx, entityId, mutationType, payload ?? {});
    return;
  }
  if (entityType === "stock_movement") {
    await applyStockMovement(db2, ctx, entityId, mutationType, payload ?? {});
    return;
  }
  if (entityType === "customer") {
    await applyCustomer(db2, ctx, entityId, mutationType, payload ?? {});
    return;
  }
  if (entityType === "product_category") {
    await applyProductCategory(db2, ctx, entityId, mutationType, payload ?? {});
    return;
  }
  if (entityType === "cash_category") {
    await applyCashCategory(db2, ctx, entityId, mutationType, payload ?? {});
    return;
  }
  if (entityType === "cash") {
    await applyCash(db2, ctx, entityId, mutationType, payload ?? {});
    return;
  }
  if (entityType === "setting") {
    await applySetting(db2, ctx, entityId, mutationType, payload ?? {});
    return;
  }
  if (entityType === "shift") {
    await applyShift(db2, ctx, entityId, mutationType, payload ?? {});
    return;
  }
  if (entityType === "supplier") {
    await applySupplier(db2, ctx, entityId, mutationType, payload ?? {});
    return;
  }
  if (entityType === "purchase") {
    await applyPurchase(db2, ctx, entityId, mutationType, payload ?? {});
    return;
  }
  if (entityType === "return") {
    await applyReturn(db2, ctx, entityId, mutationType, payload ?? {});
    return;
  }
  if (entityType === "service_order") {
    await applyServiceOrder(db2, ctx, entityId, mutationType, payload ?? {});
    return;
  }
  if (entityType === "payment_method") {
    await applyPaymentMethod(db2, ctx, entityId, mutationType, payload ?? {});
    return;
  }
  if (entityType === "recipe") {
    await applyRecipe(db2, ctx, entityId, mutationType, payload ?? {});
    return;
  }
}

// src/features/sync/routes.ts
var syncRoutes = new Hono4();
syncRoutes.use("*", authMiddleware);
syncRoutes.get("/pull", async (c) => {
  const parsed = parseSyncPullQuery({
    tenantId: c.req.query("tenantId"),
    branchId: c.req.query("branchId"),
    since: c.req.query("since")
  });
  if (!parsed.ok) {
    return c.json({ ok: false, message: parsed.message }, 400);
  }
  const branchFilter = parsed.value.branchId ? eq(products.branchId, parsed.value.branchId) : void 0;
  const sinceFilter = parsed.value.since ? gte(products.updatedAt, parsed.value.since) : void 0;
  const productRows = await db.query.products.findMany({
    where: and(eq(products.tenantId, parsed.value.tenantId), isNull(products.deletedAt), branchFilter, sinceFilter),
    orderBy: [desc(products.updatedAt)],
    limit: 100
  });
  const saleBranchFilter = parsed.value.branchId ? eq(salesOrders.branchId, parsed.value.branchId) : void 0;
  const saleSinceFilter = parsed.value.since ? gte(salesOrders.updatedAt, parsed.value.since) : void 0;
  const saleRows = await db.query.salesOrders.findMany({
    where: and(eq(salesOrders.tenantId, parsed.value.tenantId), isNull(salesOrders.deletedAt), saleBranchFilter, saleSinceFilter),
    orderBy: [desc(salesOrders.updatedAt)],
    limit: 100
  });
  const paymentBranchFilter = parsed.value.branchId ? eq(payments.branchId, parsed.value.branchId) : void 0;
  const paymentSinceFilter = parsed.value.since ? gte(payments.updatedAt, parsed.value.since) : void 0;
  const paymentRows = await db.query.payments.findMany({
    where: and(eq(payments.tenantId, parsed.value.tenantId), isNull(payments.deletedAt), paymentBranchFilter, paymentSinceFilter),
    orderBy: [desc(payments.updatedAt)],
    limit: 100
  });
  const stockBranchFilter = parsed.value.branchId ? eq(stockMovements.branchId, parsed.value.branchId) : void 0;
  const stockSinceFilter = parsed.value.since ? gte(stockMovements.updatedAt, parsed.value.since) : void 0;
  const stockRows = await db.query.stockMovements.findMany({
    where: and(eq(stockMovements.tenantId, parsed.value.tenantId), isNull(stockMovements.deletedAt), stockBranchFilter, stockSinceFilter),
    orderBy: [desc(stockMovements.updatedAt)],
    limit: 100
  });
  const customerSinceFilter = parsed.value.since ? gte(customers.updatedAt, parsed.value.since) : void 0;
  const customerRows = await db.query.customers.findMany({
    where: and(eq(customers.tenantId, parsed.value.tenantId), isNull(customers.deletedAt), customerSinceFilter),
    orderBy: [desc(customers.updatedAt)],
    limit: 100
  });
  const categoriesSinceFilter = parsed.value.since ? gte(productCategories.updatedAt, parsed.value.since) : void 0;
  const categoryRows = await db.query.productCategories.findMany({
    where: and(eq(productCategories.tenantId, parsed.value.tenantId), isNull(productCategories.deletedAt), categoriesSinceFilter),
    orderBy: [desc(productCategories.updatedAt)],
    limit: 100
  });
  const cashCategoriesSinceFilter = parsed.value.since ? gte(cashCategories.updatedAt, parsed.value.since) : void 0;
  const cashCategoryRows = await db.query.cashCategories.findMany({
    where: and(eq(cashCategories.tenantId, parsed.value.tenantId), isNull(cashCategories.deletedAt), cashCategoriesSinceFilter),
    orderBy: [desc(cashCategories.updatedAt)],
    limit: 100
  });
  const cashBranchFilter = parsed.value.branchId ? eq(cash.branchId, parsed.value.branchId) : void 0;
  const cashSinceFilter = parsed.value.since ? gte(cash.updatedAt, parsed.value.since) : void 0;
  const cashRows = await db.query.cash.findMany({
    where: and(eq(cash.tenantId, parsed.value.tenantId), cashBranchFilter, cashSinceFilter),
    orderBy: [desc(cash.updatedAt)],
    limit: 100
  });
  const settingsSinceFilter = parsed.value.since ? gte(settings.updatedAt, parsed.value.since) : void 0;
  const settingRows = await db.query.settings.findMany({
    where: and(eq(settings.tenantId, parsed.value.tenantId), settingsSinceFilter),
    orderBy: [desc(settings.updatedAt)],
    limit: 100
  });
  const shiftsBranchFilter = parsed.value.branchId ? eq(shifts.branchId, parsed.value.branchId) : void 0;
  const shiftsSinceFilter = parsed.value.since ? gte(shifts.updatedAt, parsed.value.since) : void 0;
  const shiftRows = await db.query.shifts.findMany({
    where: and(eq(shifts.tenantId, parsed.value.tenantId), shiftsBranchFilter, shiftsSinceFilter),
    orderBy: [desc(shifts.updatedAt)],
    limit: 100
  });
  const supplierSinceFilter = parsed.value.since ? gte(suppliers.updatedAt, parsed.value.since) : void 0;
  const supplierRows = await db.query.suppliers.findMany({
    where: and(eq(suppliers.tenantId, parsed.value.tenantId), isNull(suppliers.deletedAt), supplierSinceFilter),
    orderBy: [desc(suppliers.updatedAt)],
    limit: 100
  });
  const purchaseBranchFilter = parsed.value.branchId ? eq(purchases.branchId, parsed.value.branchId) : void 0;
  const purchaseSinceFilter = parsed.value.since ? gte(purchases.updatedAt, parsed.value.since) : void 0;
  const purchaseRows = await db.query.purchases.findMany({
    where: and(eq(purchases.tenantId, parsed.value.tenantId), purchaseBranchFilter, purchaseSinceFilter),
    orderBy: [desc(purchases.updatedAt)],
    limit: 100
  });
  const returnBranchFilter = parsed.value.branchId ? eq(returns.branchId, parsed.value.branchId) : void 0;
  const returnSinceFilter = parsed.value.since ? gte(returns.updatedAt, parsed.value.since) : void 0;
  const returnRows = await db.query.returns.findMany({
    where: and(eq(returns.tenantId, parsed.value.tenantId), returnBranchFilter, returnSinceFilter),
    orderBy: [desc(returns.updatedAt)],
    limit: 100
  });
  const serviceOrderBranchFilter = parsed.value.branchId ? eq(serviceOrders.branchId, parsed.value.branchId) : void 0;
  const serviceOrderSinceFilter = parsed.value.since ? gte(serviceOrders.updatedAt, parsed.value.since) : void 0;
  const serviceOrderRows = await db.query.serviceOrders.findMany({
    where: and(eq(serviceOrders.tenantId, parsed.value.tenantId), serviceOrderBranchFilter, serviceOrderSinceFilter),
    orderBy: [desc(serviceOrders.updatedAt)],
    limit: 100
  });
  const paymentMethodsSinceFilter = parsed.value.since ? gte(paymentMethods.updatedAt, parsed.value.since) : void 0;
  const paymentMethodsRows = await db.query.paymentMethods.findMany({
    where: and(eq(paymentMethods.tenantId, parsed.value.tenantId), paymentMethodsSinceFilter),
    orderBy: [desc(paymentMethods.updatedAt)],
    limit: 100
  });
  const recipeSinceFilter = parsed.value.since ? gte(recipes.updatedAt, parsed.value.since) : void 0;
  const recipeRows = await db.query.recipes.findMany({
    where: and(eq(recipes.tenantId, parsed.value.tenantId), recipeSinceFilter),
    orderBy: [desc(recipes.updatedAt)],
    limit: 100
  });
  const items = [
    ...productRows.map((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: "product",
      mutationType: "update",
      payload: {
        id: row.id,
        name: row.name,
        sku: row.sku,
        barcode: row.barcode,
        type: row.type === "service" ? "Jasa" : "Produk Fisik",
        price: Number(row.salePrice),
        stock: 0,
        status: row.isActive ? "Aktif" : "Arsip",
        isActive: row.isActive,
        salePrice: Number(row.salePrice),
        version: row.version
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
      updatedAt: row.updatedAt.toISOString()
    })),
    ...saleRows.map((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: "sale",
      mutationType: "update",
      payload: {
        id: row.id,
        code: row.orderNumber,
        orderNumber: row.orderNumber,
        customerId: row.customerId,
        status: row.status,
        subtotal: Number(row.subtotal),
        discountTotal: Number(row.discountTotal),
        taxTotal: Number(row.taxTotal),
        grandTotal: Number(row.grandTotal),
        paidTotal: Number(row.paidTotal),
        version: row.version
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
      updatedAt: row.updatedAt.toISOString()
    })),
    ...paymentRows.map((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: "payment",
      mutationType: "update",
      payload: {
        id: row.id,
        ref: row.paymentNumber,
        paymentNumber: row.paymentNumber,
        salesOrderId: row.salesOrderId,
        method: row.method,
        amount: Number(row.amount),
        status: row.status
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
      updatedAt: row.updatedAt.toISOString()
    })),
    ...stockRows.map((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: "stock_movement",
      mutationType: "update",
      payload: {
        id: row.id,
        productId: row.productId,
        warehouseId: row.warehouseId,
        type: row.type,
        qty: Number(row.qty),
        referenceType: row.referenceType,
        referenceId: row.referenceId,
        notes: row.notes
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
      updatedAt: row.updatedAt.toISOString()
    })),
    ...customerRows.map((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: "customer",
      mutationType: "update",
      payload: {
        id: row.id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        city: null,
        receivable: 0,
        orders: 0,
        status: row.isActive ? "Aktif" : "Nonaktif",
        version: row.version
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
      updatedAt: row.updatedAt.toISOString()
    })),
    ...categoryRows.map((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: "product_category",
      mutationType: "update",
      payload: {
        id: row.id,
        name: row.name,
        status: row.isActive ? "Aktif" : "Arsip"
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus ?? "synced"),
      serverSyncStatus: row.syncStatus ?? "synced",
      updatedAt: row.updatedAt.toISOString()
    })),
    ...cashCategoryRows.map((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: "cash_category",
      mutationType: "update",
      payload: {
        id: row.id,
        name: row.name,
        type: row.type === "income" ? "Pemasukan" : "Pengeluaran",
        status: row.isActive ? "Aktif" : "Nonaktif"
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
      updatedAt: row.updatedAt.toISOString()
    })),
    ...cashRows.map((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: "cash",
      mutationType: "update",
      payload: {
        id: row.id,
        ref: row.ref,
        date: row.date.toISOString(),
        account: "",
        category: row.categoryId ?? "",
        income: Number(row.income),
        expense: Number(row.expense),
        status: row.status
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
      updatedAt: row.updatedAt.toISOString()
    })),
    ...settingRows.map((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: "setting",
      mutationType: "update",
      payload: {
        id: row.key,
        key: row.key,
        area: row.area,
        value: row.value,
        status: row.status
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
      updatedAt: row.updatedAt.toISOString()
    })),
    ...shiftRows.map((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: "shift",
      mutationType: "update",
      payload: {
        id: row.id,
        cashierName: row.cashierName,
        startTime: row.startTime.toISOString(),
        endTime: row.endTime?.toISOString() ?? null,
        startCash: Number(row.startCash),
        expectedCash: row.expectedCash ? Number(row.expectedCash) : void 0,
        actualCash: row.actualCash ? Number(row.actualCash) : void 0,
        difference: row.difference ? Number(row.difference) : void 0,
        status: row.status
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
      updatedAt: row.updatedAt.toISOString()
    })),
    ...supplierRows.map((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: "supplier",
      mutationType: "update",
      payload: {
        id: row.id,
        name: row.name,
        phone: row.phone ?? "",
        city: row.city ?? "",
        payable: Number(row.payable),
        orders: row.orders,
        status: row.isActive ? "Aktif" : "Nonaktif",
        version: row.version
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
      updatedAt: row.updatedAt.toISOString()
    })),
    ...purchaseRows.map((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: "purchase",
      mutationType: "update",
      payload: {
        id: row.id,
        code: row.code,
        supplierId: row.supplierId,
        date: row.date.toISOString(),
        subtotal: Number(row.subtotal),
        grandTotal: Number(row.grandTotal),
        status: row.status,
        version: row.version
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
      updatedAt: row.updatedAt.toISOString()
    })),
    ...returnRows.map((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: "return",
      mutationType: "update",
      payload: {
        id: row.id,
        code: row.code,
        type: row.type === "sale" ? "Penjualan" : "Pembelian",
        referenceCode: row.referenceCode,
        date: row.date.toISOString(),
        total: Number(row.total),
        status: row.status,
        version: row.version
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
      updatedAt: row.updatedAt.toISOString()
    })),
    ...serviceOrderRows.map((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: "service_order",
      mutationType: "update",
      payload: {
        id: row.id,
        code: row.code,
        customerId: row.customerId,
        customerName: row.customerName,
        description: row.description,
        date: row.date.toISOString(),
        cost: Number(row.cost),
        status: row.status,
        version: row.version
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
      updatedAt: row.updatedAt.toISOString()
    })),
    ...paymentMethodsRows.map((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: "payment_method",
      mutationType: "update",
      payload: {
        id: row.id,
        name: row.name,
        provider: row.provider,
        type: row.type,
        accountNumber: row.accountNumber,
        accountName: row.accountName,
        status: row.status === "inactive" ? "Tidak Aktif" : "Aktif"
      },
      transportStatus: "applied",
      serverSyncStatus: "synced",
      updatedAt: row.updatedAt.toISOString()
    })),
    ...recipeRows.map((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: "recipe",
      mutationType: "update",
      payload: {
        id: row.id,
        productId: row.productId,
        productName: row.productName,
        name: row.name,
        batchYield: row.batchYield,
        items: row.items,
        status: row.status === "active" ? "Aktif" : "Draft"
      },
      transportStatus: "applied",
      serverSyncStatus: "synced",
      updatedAt: row.updatedAt.toISOString()
    }))
  ];
  items.sort((a, b) => a.updatedAt < b.updatedAt ? 1 : -1);
  const cursor = items.at(0)?.updatedAt ?? parsed.value.since?.toISOString() ?? null;
  return c.json({ ok: true, cursor, items });
});
syncRoutes.post("/push", async (c) => {
  const parsed = parseSyncPushBody(await c.req.json().catch(() => null));
  if (!parsed.ok) {
    return c.json({ ok: false, message: parsed.message }, 400);
  }
  const now = /* @__PURE__ */ new Date();
  const items = [];
  for (const mutation of parsed.value.mutations) {
    const payload = mutation.payload;
    if (payload === void 0) {
      await db.insert(outboxLogs).values({
        tenantId: parsed.value.tenantId,
        branchId: parsed.value.branchId ?? null,
        deviceId: parsed.value.deviceId,
        entityType: mutation.entityType,
        entityId: mutation.entityId,
        mutationType: mutation.mutationType,
        payload: { message: "payload missing" },
        status: "failed",
        attempts: 1,
        errorMessage: "payload missing",
        createdAt: now,
        updatedAt: now
      });
      items.push({
        entityId: mutation.entityId,
        entityType: mutation.entityType,
        mutationType: mutation.mutationType,
        status: "rejected",
        message: "payload missing"
      });
      continue;
    }
    let itemStatus = "applied";
    let message;
    try {
      await applyMutation(
        db,
        { tenantId: parsed.value.tenantId, branchId: parsed.value.branchId },
        mutation.entityType,
        mutation.entityId,
        mutation.mutationType,
        payload
      );
    } catch (error) {
      itemStatus = "rejected";
      message = error instanceof Error ? error.message : "apply failed";
    }
    await db.insert(outboxLogs).values({
      tenantId: parsed.value.tenantId,
      branchId: parsed.value.branchId ?? null,
      deviceId: parsed.value.deviceId,
      entityType: mutation.entityType,
      entityId: mutation.entityId,
      mutationType: mutation.mutationType,
      payload,
      status: itemStatus === "applied" ? "synced" : "failed",
      attempts: 1,
      errorMessage: itemStatus === "rejected" ? message ?? "rejected" : null,
      createdAt: now,
      updatedAt: now
    });
    items.push({
      entityId: mutation.entityId,
      entityType: mutation.entityType,
      mutationType: mutation.mutationType,
      status: itemStatus,
      message
    });
  }
  return c.json(buildSyncPushResponse(items));
});

// src/features/platform/routes.ts
import { Hono as Hono5 } from "hono";
import { z } from "zod";

// src/features/platform/middleware.ts
async function platformAdminMiddleware(c, next) {
  const userId = c.get("userId");
  if (!userId) {
    return c.json({ ok: false, message: "Authentication required" }, 401);
  }
  const rows = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, userId));
  const user = rows[0];
  if (!user || user.role !== "platform_admin") {
    return c.json({ ok: false, message: "Platform admin only" }, 403);
  }
  c.set("platformAdminId", user.id);
  await next();
}

// src/features/platform/audit.ts
async function writeAuditLog(input) {
  await db.insert(platformAuditLogs).values({
    actorId: input.actorId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId ?? null,
    payload: input.payload ?? {},
    updatedAt: /* @__PURE__ */ new Date()
  });
}

// src/features/platform/routes.ts
var platformRoutes = new Hono5();
platformRoutes.use("*", authMiddleware, platformAdminMiddleware);
platformRoutes.get("/tenants", async (c) => {
  const result = await db.select({
    id: tenants.id,
    tenantName: tenants.name,
    ownerName: users.name,
    ownerEmail: users.email,
    city: tenants.address,
    packageName: tenants.planCode,
    subscriptionStatus: tenants.subscriptionStatus,
    planValidUntil: tenants.planValidUntil,
    storageLimitGb: sql`${tenants.storageLimitMb} / 1024.0`,
    maxBranches: tenants.maxBranches,
    isActive: tenants.isActive
  }).from(tenants).leftJoin(tenantMembers, eq(tenants.id, tenantMembers.tenantId)).leftJoin(users, eq(tenantMembers.userId, users.id)).where(eq(tenantMembers.role, "owner"));
  return c.json({ ok: true, items: result });
});
platformRoutes.get("/tenants/:id", async (c) => {
  const id = c.req.param("id");
  const tenant = await db.select().from(tenants).where(eq(tenants.id, id)).then((r) => r[0]);
  if (!tenant) return c.json({ ok: false, message: "Tenant not found" }, 404);
  const members = await db.select({
    id: tenantMembers.id,
    userId: tenantMembers.userId,
    role: tenantMembers.role,
    isActive: tenantMembers.isActive,
    name: users.name,
    email: users.email
  }).from(tenantMembers).leftJoin(users, eq(tenantMembers.userId, users.id)).where(eq(tenantMembers.tenantId, id));
  return c.json({ ok: true, item: tenant, members });
});
var updateTenantSchema = z.object({
  planCode: z.string().min(1).max(40).optional(),
  billingPeriod: z.enum(["monthly", "yearly"]).optional(),
  planValidUntil: z.string().datetime().nullable().optional(),
  storageLimitMb: z.number().int().min(0).optional(),
  maxBranches: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
  subscriptionStatus: z.enum(["trial", "active", "past_due", "suspended", "cancelled"]).optional()
});
platformRoutes.patch("/tenants/:id", async (c) => {
  const id = c.req.param("id");
  const body = updateTenantSchema.parse(await c.req.json());
  const actorId = c.get("platformAdminId");
  const dbSet = { updatedAt: /* @__PURE__ */ new Date() };
  if (body.planCode !== void 0) dbSet.planCode = body.planCode;
  if (body.billingPeriod !== void 0) dbSet.billingPeriod = body.billingPeriod;
  if (body.storageLimitMb !== void 0) dbSet.storageLimitMb = body.storageLimitMb;
  if (body.maxBranches !== void 0) dbSet.maxBranches = body.maxBranches;
  if (body.isActive !== void 0) dbSet.isActive = body.isActive;
  if (body.subscriptionStatus !== void 0) dbSet.subscriptionStatus = body.subscriptionStatus;
  if (body.planValidUntil !== void 0) {
    dbSet.planValidUntil = body.planValidUntil === null ? null : new Date(body.planValidUntil);
  }
  const updated = await db.update(tenants).set(dbSet).where(eq(tenants.id, id)).returning();
  if (updated.length === 0) return c.json({ ok: false, message: "Tenant not found" }, 404);
  await writeAuditLog({
    actorId,
    action: "tenant.updated",
    targetType: "tenant",
    targetId: id,
    payload: body
  });
  return c.json({ ok: true, item: updated[0] });
});
platformRoutes.post("/tenants/:id/suspend", async (c) => {
  const id = c.req.param("id");
  const actorId = c.get("platformAdminId");
  await db.update(tenants).set({ isActive: false, subscriptionStatus: "suspended", updatedAt: /* @__PURE__ */ new Date() }).where(eq(tenants.id, id));
  await writeAuditLog({ actorId, action: "tenant.suspended", targetType: "tenant", targetId: id });
  return c.json({ ok: true });
});
platformRoutes.post("/tenants/:id/reactivate", async (c) => {
  const id = c.req.param("id");
  const actorId = c.get("platformAdminId");
  await db.update(tenants).set({ isActive: true, subscriptionStatus: "active", updatedAt: /* @__PURE__ */ new Date() }).where(eq(tenants.id, id));
  await writeAuditLog({ actorId, action: "tenant.reactivated", targetType: "tenant", targetId: id });
  return c.json({ ok: true });
});
platformRoutes.get("/plans", async (c) => {
  const includeInactive = c.req.query("includeInactive") === "true";
  const condition = includeInactive ? void 0 : eq(subscriptionPlans.isActive, true);
  const items = await db.select().from(subscriptionPlans).where(condition).orderBy(subscriptionPlans.monthlyPrice);
  return c.json({ ok: true, items });
});
var planSchema = z.object({
  code: z.string().min(1).max(40),
  name: z.string().min(1).max(120),
  billingPeriod: z.enum(["monthly", "yearly"]).optional(),
  durationDays: z.number().int().min(1).optional(),
  trialDays: z.number().int().min(0).optional(),
  monthlyPrice: z.number().min(0),
  yearlyPrice: z.number().min(0).nullable().optional(),
  storageLimitMb: z.number().int().min(0),
  maxBranches: z.number().int().min(1),
  maxUsers: z.number().int().min(1),
  features: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional()
});
platformRoutes.post("/plans", async (c) => {
  const body = planSchema.parse(await c.req.json());
  const actorId = c.get("platformAdminId");
  const inserted = await db.insert(subscriptionPlans).values({
    code: body.code,
    name: body.name,
    billingPeriod: body.billingPeriod ?? "monthly",
    durationDays: body.durationDays ?? 30,
    trialDays: body.trialDays ?? 0,
    monthlyPrice: String(body.monthlyPrice),
    yearlyPrice: body.yearlyPrice === null || body.yearlyPrice === void 0 ? null : String(body.yearlyPrice),
    storageLimitMb: body.storageLimitMb,
    maxBranches: body.maxBranches,
    maxUsers: body.maxUsers,
    features: body.features ?? {},
    isActive: body.isActive ?? true,
    updatedAt: /* @__PURE__ */ new Date()
  }).returning();
  await writeAuditLog({
    actorId,
    action: "plan.created",
    targetType: "plan",
    targetId: inserted[0].id,
    payload: body
  });
  return c.json({ ok: true, item: inserted[0] });
});
var planUpdateSchema = planSchema.partial();
platformRoutes.patch("/plans/:id", async (c) => {
  const id = c.req.param("id");
  const body = planUpdateSchema.parse(await c.req.json());
  const actorId = c.get("platformAdminId");
  const dbSet = { updatedAt: /* @__PURE__ */ new Date() };
  if (body.code !== void 0) dbSet.code = body.code;
  if (body.name !== void 0) dbSet.name = body.name;
  if (body.billingPeriod !== void 0) dbSet.billingPeriod = body.billingPeriod;
  if (body.durationDays !== void 0) dbSet.durationDays = body.durationDays;
  if (body.trialDays !== void 0) dbSet.trialDays = body.trialDays;
  if (body.monthlyPrice !== void 0) dbSet.monthlyPrice = String(body.monthlyPrice);
  if (body.yearlyPrice !== void 0) {
    dbSet.yearlyPrice = body.yearlyPrice === null ? null : String(body.yearlyPrice);
  }
  if (body.storageLimitMb !== void 0) dbSet.storageLimitMb = body.storageLimitMb;
  if (body.maxBranches !== void 0) dbSet.maxBranches = body.maxBranches;
  if (body.maxUsers !== void 0) dbSet.maxUsers = body.maxUsers;
  if (body.features !== void 0) dbSet.features = body.features;
  if (body.isActive !== void 0) dbSet.isActive = body.isActive;
  const updated = await db.update(subscriptionPlans).set(dbSet).where(eq(subscriptionPlans.id, id)).returning();
  if (updated.length === 0) return c.json({ ok: false, message: "Plan not found" }, 404);
  await writeAuditLog({
    actorId,
    action: "plan.updated",
    targetType: "plan",
    targetId: id,
    payload: body
  });
  return c.json({ ok: true, item: updated[0] });
});
platformRoutes.delete("/plans/:id", async (c) => {
  const id = c.req.param("id");
  const actorId = c.get("platformAdminId");
  const updated = await db.update(subscriptionPlans).set({ isActive: false, updatedAt: /* @__PURE__ */ new Date() }).where(eq(subscriptionPlans.id, id)).returning();
  if (updated.length === 0) return c.json({ ok: false, message: "Plan not found" }, 404);
  await writeAuditLog({ actorId, action: "plan.deleted", targetType: "plan", targetId: id });
  return c.json({ ok: true });
});
platformRoutes.get("/users", async (c) => {
  const items = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    createdAt: users.createdAt,
    membershipCount: count(tenantMembers.id)
  }).from(users).leftJoin(tenantMembers, eq(users.id, tenantMembers.userId)).groupBy(users.id).orderBy(desc(users.createdAt));
  return c.json({ ok: true, items });
});
platformRoutes.get("/users/:id", async (c) => {
  const id = c.req.param("id");
  const user = await db.select().from(users).where(eq(users.id, id)).then((r) => r[0]);
  if (!user) return c.json({ ok: false, message: "User not found" }, 404);
  const memberships = await db.select({
    id: tenantMembers.id,
    tenantId: tenantMembers.tenantId,
    role: tenantMembers.role,
    isActive: tenantMembers.isActive,
    tenantName: tenants.name
  }).from(tenantMembers).leftJoin(tenants, eq(tenantMembers.tenantId, tenants.id)).where(eq(tenantMembers.userId, id));
  return c.json({ ok: true, item: user, memberships });
});
var updateUserSchema = z.object({
  role: z.enum(["user", "platform_admin"]).optional()
});
platformRoutes.patch("/users/:id", async (c) => {
  const id = c.req.param("id");
  const body = updateUserSchema.parse(await c.req.json());
  const actorId = c.get("platformAdminId");
  if (id === actorId && body.role && body.role !== "platform_admin") {
    return c.json({ ok: false, message: "Cannot demote yourself" }, 400);
  }
  const updated = await db.update(users).set({ ...body, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
  if (updated.length === 0) return c.json({ ok: false, message: "User not found" }, 404);
  await writeAuditLog({
    actorId,
    action: "user.role_changed",
    targetType: "user",
    targetId: id,
    payload: body
  });
  return c.json({ ok: true, item: updated[0] });
});
var updateMembershipSchema = z.object({
  role: z.enum(["owner", "admin", "cashier", "staff"])
});
platformRoutes.patch("/users/:id/memberships/:memberId", async (c) => {
  const memberId = c.req.param("memberId");
  const body = updateMembershipSchema.parse(await c.req.json());
  const actorId = c.get("platformAdminId");
  const updated = await db.update(tenantMembers).set({ ...body, updatedAt: /* @__PURE__ */ new Date() }).where(eq(tenantMembers.id, memberId)).returning();
  if (updated.length === 0) return c.json({ ok: false, message: "Membership not found" }, 404);
  await writeAuditLog({
    actorId,
    action: "membership.role_changed",
    targetType: "membership",
    targetId: memberId,
    payload: { userId: c.req.param("id"), ...body }
  });
  return c.json({ ok: true, item: updated[0] });
});
platformRoutes.get("/audit", async (c) => {
  const limit = Math.min(Number(c.req.query("limit") ?? 50), 200);
  const offset = Number(c.req.query("offset") ?? 0);
  const items = await db.select({
    id: platformAuditLogs.id,
    actorId: platformAuditLogs.actorId,
    actorName: users.name,
    action: platformAuditLogs.action,
    targetType: platformAuditLogs.targetType,
    targetId: platformAuditLogs.targetId,
    payload: platformAuditLogs.payload,
    createdAt: platformAuditLogs.createdAt
  }).from(platformAuditLogs).leftJoin(users, eq(platformAuditLogs.actorId, users.id)).orderBy(desc(platformAuditLogs.createdAt)).limit(limit).offset(offset);
  const total = await db.select({ c: count() }).from(platformAuditLogs).then((r) => r[0].c);
  return c.json({ ok: true, items, total });
});

// src/features/subscription/routes.ts
import { Hono as Hono6 } from "hono";
import { z as z2 } from "zod";
var subscriptionRoutes = new Hono6();
subscriptionRoutes.use("*", authMiddleware);
subscriptionRoutes.get("/plans", async (c) => {
  const period = c.req.query("period");
  const conditions = [eq(subscriptionPlans.isActive, true)];
  if (period === "monthly" || period === "yearly") {
    conditions.push(eq(subscriptionPlans.billingPeriod, period));
  }
  const items = await db.select().from(subscriptionPlans).where(and(...conditions)).orderBy(subscriptionPlans.monthlyPrice);
  return c.json({ ok: true, items });
});
subscriptionRoutes.get("/plans/:code", async (c) => {
  const code = c.req.param("code");
  const rows = await db.select().from(subscriptionPlans).where(and(eq(subscriptionPlans.code, code), eq(subscriptionPlans.isActive, true)));
  if (rows.length === 0) return c.json({ ok: false, message: "Plan not found" }, 404);
  return c.json({ ok: true, item: rows[0] });
});
var subscribeSchema = z2.object({
  planCode: z2.string().min(1).max(40),
  billingPeriod: z2.enum(["monthly", "yearly"]).optional()
});
async function requireTenantOwnerOrAdmin(userId, tenantId) {
  const rows = await db.select({ role: tenantMembers.role }).from(tenantMembers).where(and(eq(tenantMembers.tenantId, tenantId), eq(tenantMembers.userId, userId), eq(tenantMembers.isActive, true)));
  const member = rows[0];
  if (!member || !["owner", "admin"].includes(member.role)) {
    return { ok: false, message: "Owner or admin only" };
  }
  return { ok: true, role: member.role };
}
subscriptionRoutes.post("/tenants/:tenantId/subscribe", async (c) => {
  const tenantId = c.req.param("tenantId");
  const userId = c.get("userId");
  const body = subscribeSchema.parse(await c.req.json());
  const planRows = await db.select().from(subscriptionPlans).where(and(eq(subscriptionPlans.code, body.planCode), eq(subscriptionPlans.isActive, true)));
  const plan = planRows[0];
  if (!plan) return c.json({ ok: false, message: "Plan not found" }, 404);
  const billingPeriod = body.billingPeriod ?? plan.billingPeriod;
  const tenantRows = await db.select().from(tenants).where(eq(tenants.id, tenantId));
  if (tenantRows.length === 0) return c.json({ ok: false, message: "Tenant not found" }, 404);
  const auth = await requireTenantOwnerOrAdmin(userId, tenantId);
  if (!auth.ok) return c.json({ ok: false, message: auth.message }, 403);
  const now = /* @__PURE__ */ new Date();
  const trialDays = plan.trialDays ?? 0;
  const subscriptionStatus = trialDays > 0 ? "trial" : "active";
  const planValidUntil = trialDays > 0 ? (() => {
    const date = new Date(now);
    date.setDate(date.getDate() + trialDays);
    return date;
  })() : plan.code.startsWith("free") ? null : (() => {
    const date = new Date(now);
    date.setDate(date.getDate() + plan.durationDays);
    return date;
  })();
  const [updated] = await db.update(tenants).set({
    planCode: plan.code,
    billingPeriod,
    subscriptionStatus,
    planValidUntil,
    storageLimitMb: plan.storageLimitMb,
    maxBranches: plan.maxBranches,
    isActive: true,
    updatedAt: now
  }).where(eq(tenants.id, tenantId)).returning();
  await writeAuditLog({
    actorId: userId,
    action: "tenant.subscribed",
    targetType: "subscription",
    targetId: tenantId,
    payload: { planCode: plan.code, billingPeriod, subscriptionStatus }
  });
  return c.json({ ok: true, item: updated });
});
subscriptionRoutes.post("/tenants/:tenantId/cancel", async (c) => {
  const tenantId = c.req.param("tenantId");
  const userId = c.get("userId");
  const tenantRows = await db.select().from(tenants).where(eq(tenants.id, tenantId));
  if (tenantRows.length === 0) return c.json({ ok: false, message: "Tenant not found" }, 404);
  const auth = await requireTenantOwnerOrAdmin(userId, tenantId);
  if (!auth.ok) return c.json({ ok: false, message: auth.message }, 403);
  const [updated] = await db.update(tenants).set({
    subscriptionStatus: "cancelled",
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(tenants.id, tenantId)).returning();
  await writeAuditLog({
    actorId: userId,
    action: "tenant.cancelled",
    targetType: "subscription",
    targetId: tenantId,
    payload: { previousStatus: tenantRows[0].subscriptionStatus }
  });
  return c.json({ ok: true, item: updated });
});

// src/features/updates/routes.ts
import { Hono as Hono7 } from "hono";

// src/features/updates/service.ts
var GITHUB_RELEASES_API_URL = process.env.GITHUB_RELEASES_API_URL ?? "https://api.github.com/repos/Yusufkotavom/VitPOS/releases/latest";
var PUBLIC_WEB_URL = process.env.PUBLIC_WEB_URL ?? "https://vit-pos-8vle.vercel.app";
function normalizeVersion(version2) {
  return version2.replace(/^v/i, "").trim();
}
function toSemverParts(version2) {
  return normalizeVersion(version2).split(".").map((part) => Number.parseInt(part, 10) || 0);
}
function isVersionNewer(currentVersion, nextVersion) {
  const current = toSemverParts(currentVersion);
  const next = toSemverParts(nextVersion);
  const max = Math.max(current.length, next.length);
  for (let index2 = 0; index2 < max; index2 += 1) {
    const currentPart = current[index2] || 0;
    const nextPart = next[index2] || 0;
    if (nextPart > currentPart) return true;
    if (nextPart < currentPart) return false;
  }
  return false;
}
async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json"
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch release metadata: ${response.status}`);
  }
  return response.json();
}
async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch release asset text: ${response.status}`);
  }
  return response.text();
}
async function fetchLatestRelease() {
  return fetchJson(GITHUB_RELEASES_API_URL);
}
function pickAsset(assets, matchers) {
  return assets.find((asset) => matchers.some((matcher) => matcher.test(asset.name)));
}
function desktopMatchers(target, arch) {
  if (target === "windows") {
    return [/\.msi$/i, new RegExp(`${arch}.*\\.exe$`, "i"), /setup.*\.exe$/i, /\.exe$/i];
  }
  if (target === "darwin") {
    return [/\.app\.tar\.gz$/i, /\.dmg$/i];
  }
  return [/\.AppImage$/i, /\.appimage$/i, /\.deb$/i];
}
async function resolveDesktopAsset(target, arch, assets) {
  const installer = pickAsset(assets, desktopMatchers(target, arch));
  if (!installer) return null;
  const signatureAsset = assets.find((asset) => asset.name === `${installer.name}.sig`);
  if (!signatureAsset) return null;
  return {
    installer,
    signature: (await fetchText(signatureAsset.browser_download_url)).trim()
  };
}
async function resolveAndroidUpdate(assets) {
  const apk = pickAsset(assets, [/release\.apk$/i, /app-release.*\.apk$/i]);
  if (!apk) return null;
  const checksumAsset = assets.find((asset) => asset.name === `${apk.name}.sha256`);
  return {
    apk,
    checksum: checksumAsset ? (await fetchText(checksumAsset.browser_download_url)).trim() : void 0
  };
}
async function resolveDesktopUpdate(target, arch, currentVersion) {
  const release = await fetchLatestRelease();
  const version2 = normalizeVersion(release.tag_name);
  if (!isVersionNewer(currentVersion, version2)) {
    return null;
  }
  const desktop = await resolveDesktopAsset(target, arch, release.assets);
  if (!desktop) return null;
  return {
    version: version2,
    notes: release.body || "",
    pub_date: release.published_at,
    url: desktop.installer.browser_download_url,
    signature: desktop.signature
  };
}
async function resolveAppUpdate(platform, currentVersion) {
  const release = await fetchLatestRelease();
  const version2 = normalizeVersion(release.tag_name);
  const baseResponse = {
    ok: true,
    available: isVersionNewer(currentVersion, version2),
    version: version2,
    notes: release.body || "",
    publishedAt: release.published_at || null,
    releaseUrl: release.html_url,
    webUrl: PUBLIC_WEB_URL
  };
  if (!baseResponse.available) {
    return {
      ...baseResponse,
      preferredChannel: "web",
      preferredUrl: PUBLIC_WEB_URL
    };
  }
  if (platform === "android-apk") {
    const android = await resolveAndroidUpdate(release.assets);
    return {
      ...baseResponse,
      apkUrl: android?.apk.browser_download_url,
      checksum: android?.checksum,
      preferredChannel: android ? "apk" : "web",
      preferredUrl: android?.apk.browser_download_url || PUBLIC_WEB_URL
    };
  }
  if (platform === "tauri-windows" || platform === "tauri-linux" || platform === "tauri-macos") {
    const target = platform === "tauri-windows" ? "windows" : platform === "tauri-macos" ? "darwin" : "linux";
    const desktop = await resolveDesktopAsset(target, "x86_64", release.assets);
    return {
      ...baseResponse,
      desktopUrl: desktop?.installer.browser_download_url,
      preferredChannel: desktop ? "desktop" : "web",
      preferredUrl: desktop?.installer.browser_download_url || PUBLIC_WEB_URL
    };
  }
  return {
    ...baseResponse,
    preferredChannel: "web",
    preferredUrl: PUBLIC_WEB_URL
  };
}

// src/features/updates/routes.ts
var updateRoutes = new Hono7();
updateRoutes.get("/latest", async (c) => {
  const platform = c.req.query("platform");
  const currentVersion = c.req.query("currentVersion");
  if (!platform || !currentVersion) {
    return c.json({ ok: false, message: "platform and currentVersion required" }, 400);
  }
  const payload = await resolveAppUpdate(platform, currentVersion);
  return c.json(payload);
});
updateRoutes.get("/desktop/:target/:arch/:currentVersion", async (c) => {
  const target = c.req.param("target");
  const arch = c.req.param("arch");
  const currentVersion = c.req.param("currentVersion");
  const payload = await resolveDesktopUpdate(target, arch, currentVersion);
  if (!payload) {
    return c.body(null, 204);
  }
  return c.json(payload);
});

// src/app.ts
function createApp() {
  const app2 = new Hono8();
  app2.use("*", cors());
  app2.get("/", (c) => c.json({ message: "VitPOS API is running!" }));
  app2.route("/health", healthRoutes);
  app2.route("/api/v1/health", healthRoutes);
  app2.route("/api/v1/auth", authRoutes);
  app2.route("/api/v1/sync", syncRoutes);
  app2.route("/api/v1/reports", reportRoutes);
  app2.route("/api/v1/platform", platformRoutes);
  app2.route("/api/v1/subscription", subscriptionRoutes);
  app2.route("/api/v1/updates", updateRoutes);
  app2.onError((error, c) => {
    return c.json({ ok: false, message: error.message }, 500);
  });
  return app2;
}

// src/index.ts
import { handle } from "hono/vercel";
var app = createApp();
var handler = handle(app);
var GET = handler;
var POST = handler;
var PUT = handler;
var DELETE = handler;
var PATCH = handler;
var OPTIONS = handler;
export {
  DELETE,
  GET,
  OPTIONS,
  PATCH,
  POST,
  PUT
};
