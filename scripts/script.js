// http link for opening page on other devices
// 192.168.0.161:5500/Version_2/

// Constants

var TEST_LETTERS = [
    ['S', 'T', 'A', 'G', 'E', 'D', 'R', 'E'],
    ['R', 'W', 'O', 'L', 'E', 'D', 'I', 'M'],
    ['I', 'R', 'E', 'A', 'M', 'S', 'O', 'T'],
    ['G', 'O', 'E', 'E', 'T', 'A', 'I', 'H'],
    ['O', 'N', 'R', 'O', 'T', 'O', 'D', 'A'],
];
const VOWELS = ['A', 'E', 'I', 'O', 'U'];
const CONSONANTS = [
    ['L', 'N', 'S', 'T', 'R', 'D', 'G'],
    ['B', 'C', 'M', 'P', 'F', 'H'],
    ['V', 'W', 'Y', 'K', 'J', 'X', 'Q', 'Z'],
];
var LOCKED_COLOURS = [
    ["#F6CE46", "#c7a537"],
    ["#92D050", "#6c9a3b"],
    ["#9BC2E6", "#6c87a0"],
    ["#b18dcf", "#785f8d"],
    ["#e39b9b", "#a17070"]
];

// Game generation

var GLOBAL_RNG = generateGlobalRNG(testing=false);
generateSlots();
var LETTERS =  generateLetters(); //TEST_LETTERS;
var ROUND;

if (getCookie("save")=="") {
    // if there are not saved cookies for this day,
    ROUND = 0;
    generateTiles(ROUND);
} else {
    var cookie = getCookie("save");
    ROUND = parseInt(getCookie("round"));
    for (var i = 0; i <= ROUND; i++) {
        generateTiles(i, delay=false);
    }
    stringToGrid(cookie);
    ROUND += 1;
    if (ROUND==5) {
        finish();
    } else {
        generateTiles(ROUND);
    }
}


function generateSlots() {
    // The following function generates the grid slots. This function is run when the page is 
    // loaded. 
    var grid = document.getElementById("grid");
    for (var i = 0, slot; i < 64; i++) {
        slot = document.createElement('div');
        slot.setAttribute('class', 'slot');
        slot.setAttribute('id', "slot"+String(i));
        slot.setAttribute("ondrop", "drop(event)");
        slot.setAttribute("ondragover", "allowDrop(event)");
        grid.appendChild(slot);
    }
}

function generateLetters() {
    // Procedure for letter generation:
    // Each round (except the first) can either be "easy" or "hard" (70/30). 

    // "easy":
    // - 3/4 vowels
    // - 2 easy consonants
    // - 2 medium consonants
    // - 1/0 extra consonant
    // - (50/50)
    // "hard":
    // - 3 vowels
    // - 2 easy letters
    // - 2 medium letters
    // - 1 hard letter

    var letters = [];
    var round;
    var easy;
    var forceU;
    var fourthVowel;
    for (var i = 0; i<5; i++) {
        round = [];

        // choose whether the round is easy or hard
        if (i<1) {
            easy = true;
        } else {
            easy = binOut(0.7);
        }

        // depending on round difficulty, generate letters
        if (!easy) {
            hard_letter = pick(CONSONANTS[2], 1);
            if (hard_letter=="Q") {forceU = true;} else {forceU = false;}
            // add one hard letter
            round = round.concat(hard_letter);
            // add two easy con
            round = round.concat(pick(CONSONANTS[0], 2));
            // add two medium con 
            round = round.concat(pick(CONSONANTS[1], 2));
            // add three vowels
            var vowels = pick(VOWELS, 3);
            if (forceU && !vowels.includes("U")) {
                vowels[0] = "U";
            }
            round = round.concat(vowels);
        }
        else {
            round = round.concat(pick(VOWELS, 3));
            round = round.concat(pick(CONSONANTS[0], 2));
            round = round.concat(pick(CONSONANTS[1], 2));
            fourthVowel = binOut(0.5);
            if (fourthVowel) {
                round = round.concat(pick(VOWELS, 1));
            }
            else if (binOut(0.5)) {
                round = round.concat(pick(CONSONANTS[0], 1));
            }
            else {
                round = round.concat(pick(CONSONANTS[1], 1));
            }
        }
        letters.push(round);
    }
    return letters;
}

function generateTiles(round, delay=true) {
    var letterBox = document.getElementById("box");
    var letters = LETTERS[round];
    var tiles = [];
    for (var i = 0, tile; i < letters.length; i++) {
        tile = document.createElement('div');
        tile.textContent = letters[i];
        tile.setAttribute('class', 'tile');
        tile.setAttribute("draggable", "true");
        tile.setAttribute("ondragstart", "drag(event)");
        tile.setAttribute("ondrop", "swap(event)");
        tile.setAttribute("ondragover", "allowDrop(event)");
        tile.setAttribute('id', "tile"+String((round*8)+i));
        tile.setAttribute('round-id', i);
        tile.setAttribute('round', round);
        tiles.push(tile);
        letterBox.appendChild(tile);
    }
    // apply one-time animation of appear.
    tiles.forEach(tile => {
        tile.classList.add('appear');
        if (delay) {
            tile.style.animationDelay = tile.getAttribute("round-id")/20 + "s";
        }
        tile.addEventListener('animationend', function() {
            tile.classList.remove('appear');
            tile.style.animationDelay = "0s";
        }, { once: true });
    })
}

// Reset and shuffle buttons

function reset() {
    var letterBox = document.getElementById("box");
    var tiles = Array.prototype.slice.call( document.getElementsByClassName('tile') );
    tiles.forEach(tile => {
        if (parseInt(tile.getAttribute('round'))==ROUND) {
            if (tile.parentElement.id!="box") {
                letterBox.appendChild(tile);
            }
        }
    });
}

function shuffle() {
    var letterBox = document.getElementById("box")
    // Get the children of the parent element
    const tiles = Array.from(letterBox.children);
    
    // Fisher-Yates shuffle algorithm
    for (let i = tiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }

    // Append shuffled children back to the parent element
    tiles.forEach(tile => {
        letterBox.appendChild(tile);
    });
}

// Check and next round functions

function check() {
    // The following button checks whether to proceed to the next round. The following conditions 
    // must be met before this can be done (and checked in the following order):
    //    (1) all letters have been placed on the board,
    //    (2) all letters are connected on the board,
    //    (3) in vertical and horizontal directions, real words are formed.
    // If these conditions are met, we move to the next round (completed by a separate function).
    // If conditions are not met, the relevant error messaging it produced (completed by a
    // seperate function).

    // (1)
    var letterBox = document.getElementById("box");
    if (letterBox.hasChildNodes()) {
        showInvalidMessage("All letters must be used.");
        return;
    }

    // Next, we produce the letter grid
    var letters = [];
    var count = 8*8;
    for (var i = 0, slot; i < count; i++) {
        slot = document.getElementById("slot"+String(i));
        if (slot.hasChildNodes()) {
            letters.push(slot.childNodes[0].textContent);
        } else {
            letters.push(null);
        }
    }
    var letterGrid = convertTo2DArray(letters, 8, 8);

    // (2)
    if (!isAllConnected(letterGrid)) {
        showInvalidMessage("Letters must be all connected.");
        return;
    }

    // (3)
    var found = extractWords(letterGrid);
    words = found[0];
    indexes = found[1];
    var validity = []
    for (var i = 0, word; i < words.length; i++) {
        word = words[i];
        validity.push(searchString(word));
    }
    let allTrue = arr => arr.every(Boolean);

    // Depending on the validity of words, we proceed to the next round or not.
    if (allTrue(validity)) {
        nextRound(indexes);
    } else {
        highlightIncorrect(indexes, validity);
    }
}

function showInvalidMessage(str) {
    var errorBox = document.getElementById("message-box");
    var message = document.createElement('div');
    message.textContent = str;
    message.setAttribute("class", "message");
    errorBox.insertBefore(message, errorBox.firstChild);

    tile.addEventListener('animationend', function() {
        message.remove();
    }, { once: true });
}

function highlightIncorrect(indexes, validity) {
    var invalid_indexes = [];
    for (var i = 0; i < words.length; i++) {
        if (validity[i]) {
            continue;
        }
        invalid_indexes = invalid_indexes.concat(indexConverter(indexes[i]));
    }
    invalid_indexes = [...new Set(invalid_indexes)];

    var tiles = [];
    for (var i = 0, tile, slot; i < invalid_indexes.length; i++) {
        slot = document.getElementById("slot"+String(invalid_indexes[i]))
        tile = slot.childNodes[0];
        tiles.push(tile);
    }

    tiles.forEach(tile => {
        tile.classList.add('invalid-tile');

        tile.addEventListener('animationend', function() {
            tile.classList.remove('invalid-tile');
        }, { once: true });
    })
}

function nextRound(indexes) {

    var valid_indexes = [];
    for (var i = 0; i < words.length; i++) {
        valid_indexes = valid_indexes.concat(indexConverter(indexes[i]));
    }
    valid_indexes = [...new Set(valid_indexes)];

    var tiles = [];
    for (var i = 0, tile, slot; i < valid_indexes.length; i++) {
        slot = document.getElementById("slot"+String(valid_indexes[i]))
        tile = slot.childNodes[0];
        tiles.push(tile);
    }

    tiles.forEach(tile => {
        if (tile.getAttribute("round")==parseInt(ROUND)) {
            tile.setAttribute('draggable', "false");
            tile.style.backgroundColor = LOCKED_COLOURS[ROUND][0];
            tile.style.boxShadow = "0px -4px inset " + LOCKED_COLOURS[ROUND][1];

            tile.classList.add('locked');
            tile.addEventListener('animationend', function() {
                tile.classList.remove('locked');
            }, { once: true });
        }
    })

    // save cookies
    setCookie("save", gridToString(), 1);
    setCookie("round", ROUND, 1);

    ROUND+=1;
    // 5 rounds must be completed before the game is finished
    
    if (ROUND<5) {
        setTimeout(function(){generateTiles(ROUND);}, 1500);
    }
    else {
        setTimeout(function(){finish();}, 1500);
    }
}

// Finish

function finish() {
    confetti.start();

    setTimeout(function(){
        openPopup();
    }, 1000);

    setTimeout(function(){
        confetti.stop();
    }, 5000);
}

function openPopup() {
    var messageBox = document.getElementById("message-box");
    messageBox.style.backgroundColor= "rgba(100, 100, 100, 0.8)";
    messageBox.style.pointerEvents = "auto";
    var finish = document.getElementById("finish");
    finish.style.display = "flex";
}

function closePopup() {
    var messageBox = document.getElementById("message-box");
    messageBox.style.backgroundColor = "rgba(100, 100, 100, 0)";
    messageBox.style.pointerEvents = "none";
    var finish = document.getElementById("finish");
    finish.style.display = "none";
}

// Auxillary functions

function binOut(p) {
    if (GLOBAL_RNG.nextFloat()<p) {
        return true;
    } else {
        return false;
    }
}

function pick(array, n) {
    const shuffled = array.slice(); // Create a copy of the original array
    let i = array.length;
    let temp, index;

    // While there remain elements to shuffle...
    while (i--) {
        // Pick a remaining element...
        index = Math.floor(GLOBAL_RNG.nextFloat() * (i + 1));

        // And swap it with the current element.
        temp = shuffled[i];
        shuffled[i] = shuffled[index];
        shuffled[index] = temp;
    }

    // Return the first n elements
    return shuffled.slice(0, n);
}

function isAllConnected(grid) {
    // Step 1: Identify active cells
    const activeCells = [];
    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid.length; j++) {
            if (grid[i][j] != null) {
                activeCells.push([i, j]);
            }
        }
    }

    // Step 2: Build graph
    const graph = {};
    activeCells.forEach(cell => {
        const [x, y] = cell;
        graph[cell] = [];
        // Check neighboring cells
        const neighbors = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        neighbors.forEach(([dx, dy]) => {
            const nx = x + dx;
            const ny = y + dy;
            if (grid[nx] && grid[nx][ny] != null) {
                graph[cell].push([nx, ny]);
            }
        });
    });

    // Step 3: DFS traversal
    const visited = new Set();
    function dfs(node) {
        visited.add(node.toString());
        graph[node].forEach(neighbor => {
            if (!visited.has(neighbor.toString())) {
                dfs(neighbor);
            }
        });
    }

    // Start DFS from an arbitrary active cell
    if (activeCells.length > 0) {
        dfs(activeCells[0]);
    }

    // Step 4: Check connectivity
    return visited.size === activeCells.length;
}

function convertTo2DArray(flatArray, rows, cols) {
    var twoDArray = [];
    var index = 0;
    for (var i = 0; i < rows; i++) {
        twoDArray[i] = [];
        for (var j = 0; j < cols; j++) {
        twoDArray[i][j] = flatArray[index++];
        }
    }
    return twoDArray;
}

function indexConverter(index) {
    var formatted_indexes = [];
    var direction = index[0];
    var i = index[1];
    var start = index[2];
    var end = index[3];

    for (var n = start, val; n < end; n++) {
        if (direction=="row") {
            val = (i*8)+n;
        } else {
            val = (n*8)+i;
        }
        formatted_indexes.push(val);
    }

    return formatted_indexes;
}

function extractWords(grid) {
    size = grid.length;
    validH = convertTo2DArray(Array(size*size).fill(false), size, size);
    validV = convertTo2DArray(Array(size*size).fill(false), size, size);

    // First, we check whether each position is horizontally/vertically valid.
    // A position is valid in a direction if it is adjacent to other letters.
    
    for (var i=0; i<size; i++) {
        for (var j=0; j<size; j++) {
            if (grid[i][j]!=null) {

                var validH, validV;
                // check for horizontal neighbours
                if ((j-1!=-1 && grid[i][j-1]!=null) || (j+1!=size && grid[i][j+1]!=null)) {
                    validH[i][j] = true;
                }
                // check for vertical neighbours
                if ((i-1!=-1 && grid[i-1][j]!=null) || (i+1!=size && grid[i+1][j]!=null)) {
                    validV[i][j] = true;
                }
                //check if lone letter (without loss of generality, make one direction true)
                if (!validH[i][j] && !validV[i][j]) {
                    validH[i][j] = true;
                }
            } 
        }
    }

    // Now that we have found which positions are valid in each directions, words can be extracted.
    var words = [];
    var indexes = [];
    var valid = [];
    // find horizontal words
    for (var i=0, row; i<size; i++) {
        row = grid[i];
        valid = validH[i];
        found = lineExtractWords(row, valid, i, 'row');
        words = words.concat(found[0]);
        indexes = indexes.concat(found[1]);
    }
    // find vertical words
    for (var i=0, col; i<size; i++) {
        col = [];
        valid = [];
        for (var j=0; j<size; j++) {
            col.push(grid[j][i]);
            valid.push(validV[j][i]);
        }
        found = lineExtractWords(col, valid, i, 'col');
        words = words.concat(found[0]);
        indexes = indexes.concat(found[1]);
    }
    return [words, indexes];
}

function lineExtractWords(line, valid, index, direction) {
    var words = [];
    var indexes = [];
    var currentWord = "";
    var currentIndex = [direction, index, 0, 0];
    for (var i=0; i<line.length; i++) {
        if (line[i]!=null && valid[i]) {
            currentWord += line[i];
            currentIndex[3]+=1;
        } 
        else if (currentWord!="") {
            words.push(currentWord);
            currentWord = "";
            indexes.push(currentIndex);
            currentIndex = [direction, index, i+1, i+1];
        }
        else {
            currentIndex = [direction, index, i+1, i+1];
        }
    }
    if (currentWord!="") {
        words.push(currentWord);
        indexes.push(currentIndex);
    }
    return [words, indexes];
}

function searchString(word) {
    word = word.toLowerCase();
    for (var i = 0, dict_word; i < ENGLISH_DICT.length; i++) {
        dict_word = ENGLISH_DICT[i];

        if (dict_word.length!=word.length) {
            continue;
        }
        var n = dict_word.length;

        forward_word_check: {
            for (var j = 0; j < n; j++) {
                if (dict_word[j]!=word[j]) {
                    break forward_word_check;
                }
            }
            return true;
        }
        backwards_word_check: {
            for (var j = 0; j < n; j++) {
                if (dict_word[j]!=word[n-1-j]) {
                    break backwards_word_check;
                }
            }
            return true;
        }

    }
    return false;
}

function createEmojiGrid() {
    var htmlEmojiGrid = document.getElementById("emoji-grid");
    emojiCodes = ["🟨", "🟩", "🟦", "🟪", "🟥", "⬜"];

    var txt = "";
    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 8; j++) {
            var x = 8*i + j;
            var slot = document.getElementById("slot"+String(x));
            if (slot.hasChildNodes()) {
                var tile = slot.childNodes[0];
                var round = parseInt(tile.getAttribute("round"));
                txt += emojiCodes[round];
            } else {
                txt += emojiCodes[5];
            }
        }
        txt += "\n";
    }
    htmlEmojiGrid.textContent = txt;
}