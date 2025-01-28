// http link for opening page on other devices
// 192.168.0.161:5500/Version_2/

// Global Constants

const VOWELS = ['A', 'E', 'I', 'O', 'U'];
const CONSONANTS = [
    ['L', 'N', 'S', 'T', 'R', 'D', 'G'],
    ['B', 'C', 'M', 'P', 'F', 'H'],
    ['V', 'W', 'Y', 'K', 'J', 'X', 'Q', 'Z'],
];
const EASY_ROUND_PROBABILITY = 0.7
const FOURTH_VOWEL_PROBABILITY = 0.5
const FOURTH_EASY_CONSONANT_PROBABILITY = 0.5
const LOCKED_COLOURS = [
    ["#F6CE46", "#c7a537"],
    ["#92D050", "#6c9a3b"],
    ["#9BC2E6", "#6c87a0"],
    ["#b18dcf", "#785f8d"],
    ["#e39b9b", "#a17070"]
];
const GLOBAL_RNG = generateGlobalRNG(testing=false);
const LETTERS =  generateLetters();
let CURRENT_ROUND;

/**
 * Run when the HTML is loaded, and sets up the game.
 * Here, the grid slots are first generated. Then cookies are checked for game progress.
 */
function gameSetup() {
    // generate grid slots
    generateSlots();
    // get current round
    if (cookiesPresent()) {
        CURRENT_ROUND = 0;
    }
    else {
        CURRENT_ROUND = parseInt(getCookie("round"))
    }

    if (CURRENT_ROUND == 0) {
        generateTiles(0);
    }
    elif (CURRENT_ROUND < 5) {

    }

}

/**
 * Generates the grid slots that letters can be dragged into. The function is run when the
 * page is loaded.
 */
function generateSlots() {
    let grid = document.getElementById("grid");
    for (let i = 0, slot; i < 64; i++) {
        slot = document.createElement('div');
        slot.setAttribute('class', 'slot');
        slot.setAttribute('id', "slot"+String(i));
        slot.setAttribute("ondrop", "drop(event)");
        slot.setAttribute("ondragover", "allowDrop(event)");
        grid.appendChild(slot);
    }
}


/**
 * Generate the sequence of letters that will appear in rounds throughout the game.
 * 
 * Each round has a difficult: easy or hard. The first round is always guaranteed to be easy,
 * and the consequent 5 rounds have a 0.7 chance of being easy, 0.3 chance of being hard.
 * 
 * Easy rounds will always have at least 3 vowels, 2 easy consonants and 2 medium consonants.
 * Then, the final remaining letter has a 0.5 chance of being a vowel, 0.25 chance of being 
 * an easy consonant, and 0.25 chance of being a medium consonant.
 * 
 * Hard rounds always have 3 vowels, 2 easy consonants, 2 medium consonants, and 1 hard consonant.
 * If the hard consonant is the letter 'Q', a 'u' is guaranteed as one of the vowels.  
 */
function generateLetters() {
    let letters = [];
    let round;
    let isEasyRound;
    let hardConsonant;
    let vowels;
    let forceU;
    for (let i = 0; i<5; i++) {
        round = [];
        // choose whether the round is easy or hard
        if (i<1) {
            isEasyRound = true;
        } else {
            isEasyRound = binOut(EASY_ROUND_PROBABILITY);
        }
        // depending on round difficulty, generate letters
        if (!isEasyRound) {
            hardConsonant = pick(CONSONANTS[2], 1);
            if (hardConsonant=="Q") {forceU = true;} else {forceU = false;}
            // add the hard consonants
            round = round.concat(hardConsonant);
            // add two easy consonants
            round = round.concat(pick(CONSONANTS[0], 2));
            // add two medium consonants 
            round = round.concat(pick(CONSONANTS[1], 2));
            // add three vowels
            vowels = pick(VOWELS, 3);
            if (forceU && !vowels.includes("U")) {
                vowels[0] = "U";
            }
            round = round.concat(vowels);
        }
        else {
            // add three vowels
            round = round.concat(pick(VOWELS, 3));
            // add two easy consonants
            round = round.concat(pick(CONSONANTS[0], 2));
            // add two medium consonants
            round = round.concat(pick(CONSONANTS[1], 2));
            // choose whether the final letter is a vowel or consonant
            if (binOut(FOURTH_VOWEL_PROBABILITY)) {
                round = round.concat(pick(VOWELS, 1));
            }
            // choose whether the final letter is an easy or medium consonant
            else if (binOut(FOURTH_EASY_CONSONANT_PROBABILITY)) {
                round = round.concat(pick(CONSONANTS[0], 1));
            }
            else {
                round = round.concat(pick(CONSONANTS[1], 1));
            }
        }
        // add the round letters list to the final letters list
        letters.push(round);
    }
    return letters;
}


/**
 * Generate the letter tiles for a particular round, and add the divs to the letter box.
 * 
 * 
 * @param {number} roundIndex - the round index to which tiles should be made
 * @param {boolean} delay - whether the tiles appear with a delay (default to true)
 */
function generateTiles(roundIndex, delay=true) {
    let letterBox = document.getElementById("box");
    let letters = LETTERS[roundIndex];
    let tiles = [];
    for (let i = 0, tile; i < letters.length; i++) {
        tile = document.createElement('div');
        tile.textContent = letters[i];
        tile.setAttribute('class', 'tile');
        tile.setAttribute("draggable", "true");
        tile.setAttribute("ondragstart", "drag(event)");
        tile.setAttribute("ondrop", "swap(event)");
        tile.setAttribute("ondragover", "allowDrop(event)");
        tile.setAttribute('id', "tile"+String((roundIndex*8)+i));
        tile.setAttribute('round-id', i);
        tile.setAttribute('round', roundIndex);
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
    let letterBox = document.getElementById("box");
    let tiles = Array.prototype.slice.call( document.getElementsByClassName('tile') );
    tiles.forEach(tile => {
        if (parseInt(tile.getAttribute('round'))==CURRENT_ROUND) {
            if (tile.parentElement.id!="box") {
                letterBox.appendChild(tile);
            }
        }
    });
}

function shuffle() {
    let letterBox = document.getElementById("box")
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
    let letterBox = document.getElementById("box");
    if (letterBox.hasChildNodes()) {
        showInvalidMessage("All letters must be used.");
        return;
    }

    // Next, we produce the letter grid
    let letters = [];
    let count = 8*8;
    for (let i = 0, slot; i < count; i++) {
        slot = document.getElementById("slot"+String(i));
        if (slot.hasChildNodes()) {
            letters.push(slot.childNodes[0].textContent);
        } else {
            letters.push(null);
        }
    }
    let letterGrid = convertTo2DArray(letters, 8, 8);

    // (2)
    if (!isAllConnected(letterGrid)) {
        showInvalidMessage("Letters must be all connected.");
        return;
    }

    // (3)
    let found = extractWords(letterGrid);
    words = found[0];
    indexes = found[1];
    let validity = []
    for (let i = 0, word; i < words.length; i++) {
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
    let errorBox = document.getElementById("message-box");
    let message = document.createElement('div');
    message.textContent = str;
    message.setAttribute("class", "message");
    errorBox.insertBefore(message, errorBox.firstChild);

    tile.addEventListener('animationend', function() {
        message.remove();
    }, { once: true });
}

function highlightIncorrect(indexes, validity) {
    let invalid_indexes = [];
    for (let i = 0; i < words.length; i++) {
        if (validity[i]) {
            continue;
        }
        invalid_indexes = invalid_indexes.concat(indexConverter(indexes[i]));
    }
    invalid_indexes = [...new Set(invalid_indexes)];

    let tiles = [];
    for (let i = 0, tile, slot; i < invalid_indexes.length; i++) {
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

    let valid_indexes = [];
    for (let i = 0; i < words.length; i++) {
        valid_indexes = valid_indexes.concat(indexConverter(indexes[i]));
    }
    valid_indexes = [...new Set(valid_indexes)];

    let tiles = [];
    for (let i = 0, tile, slot; i < valid_indexes.length; i++) {
        slot = document.getElementById("slot"+String(valid_indexes[i]))
        tile = slot.childNodes[0];
        tiles.push(tile);
    }

    tiles.forEach(tile => {
        if (tile.getAttribute("round")==parseInt(CURRENT_ROUND)) {
            tile.setAttribute('draggable', "false");
            tile.style.backgroundColor = LOCKED_COLOURS[CURRENT_ROUND][0];
            tile.style.boxShadow = "0px -4px inset " + LOCKED_COLOURS[CURRENT_ROUND][1];

            tile.classList.add('locked');
            tile.addEventListener('animationend', function() {
                tile.classList.remove('locked');
            }, { once: true });
        }
    })

    // save cookies
    setCookie("save", gridToString(), 1);
    setCookie("round", CURRENT_ROUND, 1);

    CURRENT_ROUND+=1;
    // 5 rounds must be completed before the game is finished
    
    if (CURRENT_ROUND<5) {
        setTimeout(function(){generateTiles(CURRENT_ROUND);}, 1500);
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
    let messageBox = document.getElementById("message-box");
    messageBox.style.backgroundColor= "rgba(100, 100, 100, 0.8)";
    messageBox.style.pointerEvents = "auto";
    let finish = document.getElementById("finish");
    finish.style.display = "flex";
}

function closePopup() {
    let messageBox = document.getElementById("message-box");
    messageBox.style.backgroundColor = "rgba(100, 100, 100, 0)";
    messageBox.style.pointerEvents = "none";
    let finish = document.getElementById("finish");
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
    let twoDArray = [];
    let index = 0;
    for (let i = 0; i < rows; i++) {
        twoDArray[i] = [];
        for (let j = 0; j < cols; j++) {
        twoDArray[i][j] = flatArray[index++];
        }
    }
    return twoDArray;
}

function indexConverter(index) {
    let formatted_indexes = [];
    let direction = index[0];
    let i = index[1];
    let start = index[2];
    let end = index[3];

    for (let n = start, val; n < end; n++) {
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
    let size = grid.length;
    let validH = convertTo2DArray(Array(size*size).fill(false), size, size);
    let validV = convertTo2DArray(Array(size*size).fill(false), size, size);

    // First, we check whether each position is horizontally/vertically valid.
    // A position is valid in a direction if it is adjacent to other letters.
    
    for (let i=0; i<size; i++) {
        for (let j=0; j<size; j++) {
            if (grid[i][j]!=null) {

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
    let words = [];
    let indexes = [];
    let valid = [];
    // find horizontal words
    for (let i=0, row; i<size; i++) {
        row = grid[i];
        valid = validH[i];
        found = lineExtractWords(row, valid, i, 'row');
        words = words.concat(found[0]);
        indexes = indexes.concat(found[1]);
    }
    // find vertical words
    for (let i=0, col; i<size; i++) {
        col = [];
        valid = [];
        for (let j=0; j<size; j++) {
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
    let words = [];
    let indexes = [];
    let currentWord = "";
    let currentIndex = [direction, index, 0, 0];
    for (let i=0; i<line.length; i++) {
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
    for (let i = 0, dict_word; i < ENGLISH_DICT.length; i++) {
        dict_word = ENGLISH_DICT[i];

        if (dict_word.length!=word.length) {
            continue;
        }
        let n = dict_word.length;

        forward_word_check: {
            for (let j = 0; j < n; j++) {
                if (dict_word[j]!=word[j]) {
                    break forward_word_check;
                }
            }
            return true;
        }
        backwards_word_check: {
            for (let j = 0; j < n; j++) {
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
    let htmlEmojiGrid = document.getElementById("emoji-grid");
    emojiCodes = ["🟨", "🟩", "🟦", "🟪", "🟥", "⬜"];

    let txt = "";
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            let x = 8*i + j;
            let slot = document.getElementById("slot"+String(x));
            if (slot.hasChildNodes()) {
                let tile = slot.childNodes[0];
                let round = parseInt(tile.getAttribute("round"));
                txt += emojiCodes[round];
            } else {
                txt += emojiCodes[5];
            }
        }
        txt += "\n";
    }
    htmlEmojiGrid.textContent = txt;
}


function gridToString() {
    var tileArray = [];
    var tiles = Array.prototype.slice.call( document.getElementsByClassName("tile") );
    var slot;
    tiles.forEach(tile => {
        if (tile.parentElement.className=="slot") {
            slot = tile.parentElement;
            tileArray.push(tile.id + ":" + slot.id);
        } else {
            tileArray.push(tile.id + ":#");
        }
    });
    return tileArray.join("-");
}

function stringToGrid(string) {
    var letterBox = document.getElementById("box");
    var strArray = string.split("-");
    var tile, slot, x, round;
    strArray.forEach(str => {
        x = str.split(":");
        tile = document.getElementById(x[0]);
        if (x[1]!="#") {
            round = parseInt(tile.getAttribute("round"));
            tile.setAttribute('draggable', "false");
            tile.style.backgroundColor = LOCKED_COLOURS[round][0];
            tile.style.boxShadow = "0px -4px inset " + LOCKED_COLOURS[round][1];
            slot = document.getElementById(x[1]);
            slot.appendChild(tile);
        } else {
            letterBox.appendChild(tile);
        }
    });
}