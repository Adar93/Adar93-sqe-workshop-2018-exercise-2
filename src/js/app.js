import $ from 'jquery';
//import {parseCode} from './code-analyzer';
import {tableCreation} from './code-analyzer';

function updateTable(tab){
    let ans = '';
    for (let i = 0; i<tab.length; i++) {
        if (tab[i].Code != null) {
            if (tab[i].Color != null) {
                if (tab[i].Color === 'red')
                    ans = ans + '<mark class = "red">' + tab[i].Code + '</mark></br>';
                else
                    ans = ans + '<mark class = "green">' + tab[i].Code + '</mark></br>';
            }
            else
                ans = ans + tab[i].Code +'</br>';
        }
    }
    return ans;

}

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let inputVector = $('#inputVector').val();
        let codeToParse = $('#codePlaceholder').val();
        let tab = tableCreation(codeToParse, inputVector);
        /*
        $('#parsedCode').val(ans);*/
        let HTMLtab = document.getElementById('tableBody');
        HTMLtab.innerHTML = '';
        let ans = updateTable(tab);
        HTMLtab.innerHTML = HTMLtab.innerHTML + ans;
    });
});
