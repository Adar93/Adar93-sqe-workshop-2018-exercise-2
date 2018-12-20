import * as esprima from 'esprima';
import * as escodegen from 'escodegen';

const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse);
};

function CodeRow (code, color){
    return {
        Code: code,
        Color: color
    };
}

const Functions = {
    'IfStatement' : parseIf,
    'FunctionDeclaration' : parseFunc,
    'VariableDeclaration' : parseLet,
    'WhileStatement' : parseWhile,
    'ReturnStatement' : parseRet,
    'ExpressionStatement' : parseExp,
    'AssignmentExpression' : parseAssign,
    'BlockStatement': parseBlock
};

const Expressions = {
    'Identifier' : parseIdentifier,
    'Literal' : parseLiteral,
    'BinaryExpression' : parseBinExpr,
    'LogicalExpression' : parseBinExpr,
    'MemberExpression' : parseMember,
    'UnaryExpression' : parseUnary
};

function parseIdentifier(Exp,dictionary){
    if (dictionary[Exp.name] != null)
        return dictionary[Exp.name];
    return Exp.name;
}

function parseLiteral(Exp){
    return escodegen.generate(Exp);
}

function parseBinExpr(Exp,dictionary,values){
    let val, left, op, right;
    left = Expressions[Exp.left.type](Exp.left,dictionary,values);
    right = Expressions[Exp.right.type](Exp.right,dictionary,values);
    op = Exp.operator;
    if(!(isNaN(left)) && !(isNaN(right)))
        val = eval(left + ' ' + op + ' ' + right);
    else
        val = '(' + left + ' ' + op + ' ' + right + ')';
    return val;
}

function parseUnary(Exp,dictionary,values){
    let op, val;
    op = Exp.operator;
    val = Expressions[Exp.argument.type](Exp.argument,dictionary,values);
    return op + '(' + val + ')';
}

function checkInValues(i,arr,dictionary,values){
    let val;
    // arr is not a parameter
    if(!(isNaN(i)) && arr in values) {
        val = values[arr][i];
    }
    // arr is a parameter
    if(!(isNaN(i)) && arr in dictionary) {
        val = dictionary[arr][i];
    }
    /*else
        val = arr + '[' + i + ']';*/
    return val;
}

function parseMember(Exp,dictionary,values) {
    let arr, i, val;
    arr = escodegen.generate(Exp.object);
    i = Expressions[Exp.property.type](Exp.property, dictionary, values);
    //only inside if condition
    if (isInIfCond) {
        val = checkInValues(i, arr, dictionary, values);
    }
    // outside if - regular substitution
    else {
        if (!(isNaN(i)) && arr in dictionary) {
            val = dictionary[arr][i];
        }
        else
            val = arr + '[' + i + ']';
    }
    return val;
}

function copyDictionaries(fromDict, toDict){
    Object.keys(fromDict).forEach(function(key) {
        toDict[key] = fromDict[key];
    });
}

function parseBlock(Body,dictionary,values){
    let Table = [];
    let code = '{';
    let row = new CodeRow(code, null);
    Table.push(row);
    let dictionary2 = {};
    copyDictionaries(dictionary, dictionary2);
    let values2 = {};
    copyDictionaries(values, values2);
    for (let i = 0; i<Body.body.length; i++)
        Table = Table.concat(Functions[Body.body[i].type](Body.body[i],dictionary,values));
    copyDictionaries(dictionary2, dictionary);
    copyDictionaries(values2, values);
    code = '}';
    row = new CodeRow(code, null);
    Table.push(row);
    return Table;
}

function parseExp(Body,dictionary,values){
    return Functions[Body.expression.type](Body.expression,dictionary,values);
}

function updateValInArr(Exp,val,dictionary,values) {
    let arr, i;
    let Table = [];
    arr = escodegen.generate(Exp.object);
    i = Expressions[Exp.property.type](Exp.property,dictionary,values);
    let name = arr + '[' + i + ']';
    if(arr in values) {
        values[arr][i] = val;
        let code = name + ' = ' + val + ';';
        let row = new CodeRow(code, null);
        Table.push(row);
    }
    else{
        dictionary[arr][i] = val;
    }
    return Table;
}

function assignCode(name,val,dictionary,values){
    let Table = [];
    if (name in values) {
        values[name] = val;
        let code = name + ' = ' + values[name] + ';';
        let row = new CodeRow(code, null);
        Table.push(row);
    }
    else {
        dictionary[name] = val;
    }
    return Table;
}

function parseAssign(Body,dictionary,values){
    let Table = [];
    let name = escodegen.generate(Body.left);
    let val = Expressions[Body.right.type](Body.right,dictionary,values);
    if (Body.left.type === 'MemberExpression'){
        Table = Table.concat(updateValInArr(Body.left,val,dictionary,values));
    }
    else {
        Table = Table.concat(assignCode(name,val,dictionary,values));
    }
    return Table;
}

function parseLet(Body,dictionary,values){
    let Table = [];
    for (let i = 0; i<Body.declarations.length; i++) {
        let name = Body.declarations[i].id.name;
        let val = null;
        if (Body.declarations[i].init != null) {
            if (Body.declarations[i].init.type === 'ArrayExpression') {
                val = arrayParam(Body.declarations[i].init.elements);
                dictionary[name] = val;
                val = '[' + val + ']';
            } else {
                val = Expressions[Body.declarations[i].init.type](Body.declarations[i].init, dictionary, values);
                dictionary[name] = val;
            }}} if(!isInFunc) {
        let enter = escodegen.generate(Body).indexOf(';');
        let code = escodegen.generate(Body).substr(0,enter + 1);
        let row = new CodeRow(code, null);
        Table.push(row);
    } return Table;
}

function parseCond(cond,values,dictionary){
    let Body = parseCode(cond);
    isInIfCond = true;
    let parsedCond = Expressions[Body.body[0].expression.type](Body.body[0].expression,values,dictionary);
    isInIfCond = false;
    return eval(parsedCond);
}

function parseIf(Body,dictionary,values){
    let Table = [];
    let cond = Expressions[Body.test.type](Body.test,dictionary,values);
    let code = 'if (' + cond + ')';
    let condEval = parseCond(cond,values,dictionary);
    let color;
    if(condEval) color = 'green';
    else color = 'red';
    let row = new CodeRow(code, color);
    Table.push(row);
    Table = Table.concat(Functions[Body.consequent.type](Body.consequent,dictionary,values));
    if (Body.alternate != null){
        code = 'else';
        row = new CodeRow(code, null);
        Table.push(row);
        Table = Table.concat(Functions[Body.alternate.type](Body.alternate,dictionary,values));
    }
    return Table;
}

function arrayParam(arrayInput){
    let arr = [];
    for (let i = 0; i<arrayInput.length; i++){
        arr[i] = escodegen.generate(arrayInput[i]);
    }
    return arr;
}

function funcParams(Body,dictionary,values){
    for (let i = 0; i<Body.length; i++) {
        let name = escodegen.generate(Body[i]);
        let val;
        if( inputVector[i].type !== 'ArrayExpression')
            val = escodegen.generate(inputVector[i]);
        else
            val = arrayParam(inputVector[i].elements);
        values[name] = val;
        if(name in dictionary)
            delete dictionary[name];
    }
}

function parseFunc(Body,dictionary,values){
    isInFunc = true;
    let Table = [];
    let enter = escodegen.generate(Body).indexOf('{');
    let code = escodegen.generate(Body).substr(0,enter);
    let row = new CodeRow(code,null);
    Table.push(row);
    if (inputVector != null)
        funcParams(Body.params,dictionary,values);
    Table = Table.concat(Functions[Body.body.type](Body.body,dictionary,values));
    isInFunc = false;
    return Table;
}

function parseWhile(Body,dictionary,values){
    let Table = [];
    let cond = Expressions[Body.test.type](Body.test,dictionary,values);
    let code = 'while (' + cond + ')';
    let row = new CodeRow(code, null);
    Table.push(row);
    Table = Table.concat(Functions[Body.body.type](Body.body,dictionary,values));
    return Table;
}

function parseRet(Body,dictionary,values){
    let Table = [];
    let val = Expressions[Body.argument.type](Body.argument,dictionary,values);
    let code = 'return ' + val + ';';
    let row = new CodeRow(code, null);
    Table.push(row);
    return Table;
}

function loopBody(parsedCode){
    let Table = [];
    let dictionary = {};
    let values = {};
    for (let i = 0; i<parsedCode.body.length; i++){
        Table = Table.concat(Functions[parsedCode.body[i].type](parsedCode.body[i],dictionary,values));
    }
    return Table;
}

let inputVector;
let isInFunc = false;
let isInIfCond = false;

function tableCreation(codeToParse, inVec){
    let parsedCode = parseCode(codeToParse);
    inputVector = parseCode(inVec);
    if (inputVector.body[0]!=null){
        if(inputVector.body[0].expression.type === 'SequenceExpression')
            inputVector = inputVector.body[0].expression.expressions;
        else inputVector = [inputVector.body[0].expression];
    }
    else (inputVector = null);
    return loopBody(parsedCode);
}

export {parseCode, tableCreation, parseAssign, parseLet, parseIf, parseWhile, parseFunc};
