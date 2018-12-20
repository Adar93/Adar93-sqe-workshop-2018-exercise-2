import assert from 'assert';
import {parseCode, tableCreation, parseAssign, parseLet, parseIf, parseWhile, parseFunc} from '../src/js/code-analyzer';

let dictionary = {a:1, b:2, c:3, d:[0,1]};
let values = {x:1, y:2, z:3,  n:[0,1]};

describe('Let parser', () => {
    it('is parsing a simple variable declaration correctly', () => {
        assert.deepEqual(
            JSON.stringify(parseLet(parseCode('let e = 7;').body[0],dictionary,values)),
            '[{"Code":"let e = 7;","Color":null}]'
        );
    });
    it('is parsing a variable declaration for array correctly', () => {
        assert.deepEqual(
            JSON.stringify(parseLet(parseCode('let e = [1,2,3];').body[0],dictionary,values)),
            '[{"Code":"let e = [\\n    1,\\n    2,\\n    3\\n];","Color":null}]'
        );
    });
});

describe('Assign parser', () => {
    it('is parsing a simple Assignment correctly for parameter', () => {
        assert.deepEqual(
            JSON.stringify(parseAssign(parseCode('x = 7;').body[0].expression,dictionary,values)),
            '[{"Code":"x = 7;","Color":null}]'
        );
    });
    it('is parsing a simple Assignment correctly for non parameter', () => {
        parseAssign(parseCode('a = 7;').body[0].expression,dictionary,values);
        assert.ok(dictionary.a === '7');
    });
});

describe('Assign parser', () => {
    it('is parsing array Assignment correctly for parameter', () => {
        assert.deepEqual(
            JSON.stringify(parseAssign(parseCode('n[y] = 7;').body[0].expression, dictionary, values)),
            '[{"Code":"n[y] = 7;","Color":null}]'
        );
    });
    it('is parsing array Assignment correctly for parameter', () => {
        parseAssign(parseCode('d[2] = 7;').body[0].expression,dictionary,values);
        assert.ok(dictionary.d[2] === '7');
    });
});

describe('If parser', () => {
    it('is parsing an if statement correctly', () => {
        assert.deepEqual(
            JSON.stringify(parseIf(parseCode('if (true){\n' +
                'x=y;\n' +
                '}').body[0],dictionary,values)),
            '[{"Code":"if (true)","Color":"green"},{"Code":"{","Color":null},{"Code":"x = y;","Color":null},{"Code":"}","Color":null}]'
        );
    });
    it('is parsing an else - if statement correctly', () => {
        assert.deepEqual(
            JSON.stringify(parseIf(parseCode('if (false){\n' + 'x=y;\n' + '}\n' +
                'else {\n' + 'y=x;\n' + '}').body[0],dictionary,values)),
            '[{"Code":"if (false)","Color":"red"},{"Code":"{","Color":null},{"Code":"x = y;","Color":null},{"Code":"}","Color":null},{"Code":"else","Color":null},{"Code":"{","Color":null},{"Code":"y = x;","Color":null},{"Code":"}","Color":null}]'
        );
    });
});

describe('While parser', () => {
    it('is parsing a while loop correctly', () => {
        assert.deepEqual(
            JSON.stringify(parseWhile(parseCode('while (x < y) {\n' +
                'x = x + 1;\n' +
                'y = y / 2;\n' +
                '}').body[0],dictionary,values)),
            '[{"Code":"while ((x < y))","Color":null},{"Code":"{","Color":null},{"Code":"x = (x + 1);","Color":null},{"Code":"y = (y / 2);","Color":null},{"Code":"}","Color":null}]'
        );
    });
});

describe('Func parser', () => {
    it('is parsing a simple function correctly', () => {
        assert.deepEqual(
            JSON.stringify(parseFunc(parseCode('function func(){}').body[0],{},{})),
            '[{"Code":"function func() ","Color":null},{"Code":"{","Color":null},{"Code":"}","Color":null}]'
        );
    });
    it('is parsing a function with params & return statement correctly', () => {
        assert.deepEqual(
            JSON.stringify(parseFunc(parseCode('function func(x){\n' +
                'return x;\n' +
                '}').body[0],{},{})),
            '[{"Code":"function func(x) ","Color":null},{"Code":"{","Color":null},{"Code":"return x;","Color":null},{"Code":"}","Color":null}]'
        );
    });
});

describe('Parser', () => {
    it('is parsing a function correctly without params', () => {
        assert.deepEqual(
            JSON.stringify(tableCreation('function foo(){\n' +
                'let a;\n' +
                'a = 1 + 1;\n' +
                'return a;\n' +
                '}', '')),
            '[{"Code":"function foo() ","Color":null},{"Code":"{","Color":null},{"Code":"return 2;","Color":null},{"Code":"}","Color":null}]'
        );
    });
});

describe('Parser', () => {
    it('is parsing a function correctly with array in param', () => {
        assert.deepEqual(
            JSON.stringify(tableCreation('function foo(x){\n' +
                'let a = x[0];\n' +
                'let b = [0,1];\n' +
                'if (b[0]) {\n' +
                'return a;\n' +
                '}\n' +
                'else if (a) {\n' +
                'return a;\n' +
                '}\n' +
                '}', '[1]')),
            '[{"Code":"function foo(x) ","Color":null},{"Code":"{","Color":null},{"Code":"if (0)","Color":"red"},{"Code":"{","Color":null},{"Code":"return x[0];","Color":null},{"Code":"}","Color":null},{"Code":"else","Color":null},{"Code":"if (x[0])","Color":"green"},{"Code":"{","Color":null},{"Code":"return x[0];","Color":null},{"Code":"}","Color":null},{"Code":"}","Color":null}]'
        );
    });
});

describe('Parser', () => {
    it('is parsing a function correctly with local arrays', () => {
        assert.deepEqual(
            JSON.stringify(tableCreation('let b, c, x = 5;\n' +
                'function foo(x, y){\n' +
                '    let a = [0,1,2];\n' +
                '    b = a[x];\n' +
                '    c = a[y];\n' +
                '    let d = a[2];\n' +
                '    \n' +
                '    if (b) {\n' +
                '        return d;\n' +
                '    } \n' +
                'else if (c) {\n' +
                '        return -d;\n' +
                '    } \n' + '}', '0,1')),
            '[{"Code":"let b, c, x = 5;","Color":null},{"Code":"function foo(x, y) ","Color":null},{"Code":"{","Color":null},{"Code":"if (a[x])","Color":"red"},{"Code":"{","Color":null},{"Code":"return 2;","Color":null},{"Code":"}","Color":null},{"Code":"else","Color":null},{"Code":"if (a[y])","Color":"green"},{"Code":"{","Color":null},{"Code":"return -(2);","Color":null},{"Code":"}","Color":null},{"Code":"}","Color":null}]'
        );
    });
});