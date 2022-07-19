module.exports = grammar( {
  name: 'bml',

  extras: $ => [
    /\s|\\\r?\n/,
    /\s/,
    $.comment,
  ],

  word: $ => $.identifier,

  rules: {
    source_file: $ => repeat(choice(
      $._statement,
    ) ),
    
    _statement: $ => choice(
      $._simple_statement,
      $.return_statement,
      $.if_statement,
      // $.for_statement,
      $.block
    ),
    
    _statement_list: $ => choice(
      seq(
        $._statement,
        repeat(seq(';', $._statement)),
      )
    ),
    
    _simple_statement: $ => seq(choice(
      $._expression,
      $.assignment_statement,
      $.break_statement,
      $.continue_statement
      ),
      ';'
    ),
    
    assignment_statement: $ => seq(
      field('left', $._expression),
      field('operator', '=', ),
      field('right', $._expression)
    ),
    
    break_statement: $ => 'break',
    
    continue_statement: $ => 'continue',
    
    return_statement: $ => seq('return', optional($._expression),';'),
    
    if_statement: $ => seq(
      'if',
      field('condition', $.parenthesized_expression),
      field('consequence', $.block),
      optional(choice(
        repeat(seq(
          'elif',
          field('condition',$.parenthesized_expression),
          field('alternative',$.block)
        )),
        seq(
          'else',
          field('alternative', $.block)
        )
      ))
    ),
    
    block: $ => seq(
      '{',
      optional($._statement_list),
      '}'
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
    ),
    
    _type: $ => choice(
      'Boolean',
      'Date',
      'Float',
      'Integer',
      'String'
    ),
    
    subscript_expression: $ => prec(13,seq(
      field('argument', $.identifier),
      '[',
      field('index', $._expression),
      ']',
      repeat(seq('[',
        field('index', $._expression),
        ']'
      ))
    )),
    
    array_declaration: $ => prec.left(1,seq(
      $._type,
      repeat(seq(
        '[',
        optional(field('size', $._expression)),
        ']'
      )),
    )),

    // array_statement: $ => prec(13,seq(
    //   field('argument', $._expression),
    //   repeat(seq(
    //     '[',
    //     optional(field('length',/[0-9]+/)),
    //     ']'
    //   ))
    // )),
    
    call_expression: $ => prec(13,seq(
      field('function', $.identifier),
      repeat(seq(
        '.',
        $.identifier
      )),
      field('arguments',$.argument_list)
    )),
    
    argument_list: $ => seq('(', commaSep($._expression), ')'),
    
    unary_expression: $ => prec.left(13, seq(
      field('operator', choice('not', '-', '+')),
      field('argument', $._expression)
    )),
        
    binary_expression: $ => {
      const table = [
        ['+', 10],
        ['-', 10],
        ['*', 11],
        ['/', 11],
        ['%', 11],
        ['and',2],
        ['or', 1],
        ['==', 6],
        ['<>', 6],
        ['>' , 7],
        ['<' , 7],
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
        seq('"', repeat(/[^"]/),'"'),
        seq('\'', repeat(/[^']/),'\'')
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
} )

function commaSep (rule) {
  return optional(commaSep1(rule))
}

function commaSep1 (rule) {
  return seq(rule, repeat(seq(',', rule)))
}