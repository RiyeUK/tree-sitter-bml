module.exports = grammar({
  name: 'bml',

  extras: $ => [
    /\s|\\\r?\n/,
    /\s/,
    $.comment,
  ],

  word: $ => $.identifier,

  rules: {
    source_file: $ => repeat($._statement),

    _statement: $ => choice(
      $._simple_statement,
      $.if_statement,
      $.for_statement,
      $.block
    ),

    _simple_statement: $ => seq(
      choice(
        $._expression,
        $.return_statement,
        $.assignment_statement,
        $.break_statement,
        $.continue_statement
      ),
      ';'
    ),

    assignment_statement: $ => seq(
      field('left', $._expression),
      field('operator', '='),
      field('right', $._expression)
    ),

    break_statement: $ => 'break',

    continue_statement: $ => 'continue',

    return_statement: $ => seq('return', optional($._expression)),

    if_statement: $ => seq(
      'if',
      field('condition', $.parenthesized_expression),
      field('consequence', $.block),
      optional(choice(
        repeat(seq(
          'elif',
          field('condition', $.parenthesized_expression),
          field('alternative', $.block)
        )),
        seq(
          repeat(seq(
            'elif',
            field('condition', $.parenthesized_expression),
            field('alternative', $.block)
          )),
          optional(seq('else', field('alternative', $.block)))
        ),
        seq(
          'else',
          field('alternative', $.block)
        )
      ))
    ),

    block: $ => seq(
      '{',
      optional(repeat($._statement)),
      '}'
    ),

    for_statement: $ => seq(
      'for',
      field('itorator', $._expression),
      'in',
      field('array', $._expression),
      $.block
    ),

    comment: $ => token(choice(
      seq('//', /.*/),
      seq(
        '/*',
        /[^*]*\*+([^/*][^*]*\*+)*/,
        '/'
      )
    )),

    _expression: $ => choice(
      $.binary_expression,
      $.unary_expression,
      $.number_literal,
      $.string_literal,
      $.identifier,
      $.parenthesized_expression,
      $.call_expression,
      $.true,
      $.false,
      $.null,
      $.print,
      $.subscript_expression,
      $.array_declaration,
      $.dot_expression,
    ),

    type: $ => choice(
      'boolean',
      'date',
      'float',
      'integer',
      'string'
    ),

    dot_expression: $ => prec(13, seq(
      field('identifyer', $.identifier), '.', $.identifier,
      repeat(seq('.', $.identifier))
    )),

    subscript_expression: $ => prec(13, seq(
      field('argument', $.identifier),
      '[',
      field('index', $.number_literal),
      ']',
      optional(
        seq(
          '[',
          field('index', $.number_literal),
          ']'
        ),
      ),
    )),

    array_declaration: $ => prec.left(1, seq(
      $.type,
      '[',
      optional(field('index', $.number_literal)),
      ']',
      optional(seq(
        '[',
        optional(field('size', $.number_literal)),
        ']'
      )),
    )),

    call_expression: $ => prec(13, seq(
      field('function', choice($.identifier, $.dot_expression, $.type)),
      field('arguments', $.argument_list)
    )),

    argument_list: $ => seq(
      '(',
      repeat(seq($._expression,',')),
      optional($._expression),
      ')'
    ),

    unary_expression: $ => prec.right(14, seq(
      field('operator', choice('not', 'NOT', '-', '+')),
      field('argument', $._expression)
    )),

    binary_expression: $ => {
      const table = [
        ['+', 10],
        ['-', 10],
        ['*', 11],
        ['/', 11],
        ['%', 11],
        ['and', 2],
        ['AND', 2],
        ['or', 1],
        ['OR', 1],
        ['==', 6],
        ['<>', 6],
        ['>', 7],
        ['<', 7],
        ['<=', 7],
        ['>=', 7],
      ];

      return choice(...table.map(([operator, precedence]) => {
        return prec.left(precedence, seq(
          field('left', $._expression),
          field('operator', operator),
          field('right', $._expression)
        ))
      }));
    },

    identifier: $ => /[a-zA-Z_]\w*/,

    number_literal: $ => token(/[0-9]+\.?[0-9]*|\.[0-9]+/),

    string_literal: $ => token(
      choice(
        seq('"', repeat(/[^"]/), '"'),
        seq('\'', repeat(/[^']/), '\'')
      )
    ),

    parenthesized_expression: $ => seq(
      '(',
      $._expression,
      ')',
    ),

    print: $ => seq('print', $._expression),
    true: $ => 'true',
    false: $ => 'false',
    null: $ => 'null',
  }
})
