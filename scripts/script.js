// http link for opening page on other devices
// 192.168.0.161:5500/Version_2/


/** ---------- GLOBALS ---------- */ 


const VOWELS = [
    'A', 'E', 'I', 'O', 'U'
];
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
const GLOBAL_RNG = generateGlobalRNG();
const LETTERS =  generateLetters();
const VALID_WORDS_CACHE = [];
let CURRENT_ROUND;
let CHECK_IS_RUNNING = false;


/** ---------- GAME GENERATION ---------- */ 


/**
 * Run when the HTML is loaded, and sets up the game.
 * First, the grid slots are generated. Next, game progress is checked in the cookies.
 * If there are no cookies, there is no saved progress and the game starts from the first round.
 * If cookies are found, the tiles are placed accordingly up till the saved round, and then the game
 * resumes from the next round.
 */
function gameSetup() {
    // generate grid slots
    generateSlots()
    // from cookies, retrieve saved game progress, if present
    if (!cookiesPresent()) {
        CURRENT_ROUND = 0;
        generateTiles(round=0);
    }
    else {
        let roundsCompletedIndex = parseInt(getCookie("round"));
        // generate all the tiles already completed
        for (let i = 0; i <= roundsCompletedIndex; i++) {
            generateTiles(round=i, delay=false);
        }
        // move these tiles to their correct locations
        let savedTileData = getCookie("save");
        moveTilesToSavedPositions(savedTileData);
        // Update current round
        if (roundsCompletedIndex==4) {
            gameFinish();
        } else {
            CURRENT_ROUND = roundsCompletedIndex + 1;
            generateTiles(CURRENT_ROUND)
        }
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
    // apply one-time animation of appear
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


/**
 * Given the cookie data, move all the tiles generated from previous rounds to their correct 
 * positions.
 * 
 * @param {string} savedTileData 
 */
function moveTilesToSavedPositions(savedTileData) {
    var letterBox = document.getElementById("box");
    var strArray = savedTileData.split("-");
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


/** ---------- ^ UTILITY ^ ---------- */ 


/**
 * Randomly generates true or false with certain probability.
 * That is, generates single Bernoulli trial outcome.
 * 
 * @param {*} p - probability of success,
 * @returns {boolean} whether the Bernoulli trial was successful
 */
function binOut(p) {
    if (GLOBAL_RNG.nextFloat()<p) {
        return true;
    } else {
        return false;
    }
}

/**
 * Pick a n elements from an array.
 * 
 * @param {array} array - array to select from
 * @param {number} n - the number of elements to take in subset
 * @returns {array} - random subset of array
 */
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


/** ---------- LETTER BOX FUNCTIONS ---------- */ 


/**
 * Allows the user to return all the round letters on the grid to the letters box.
 */
function returnLetters() {
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

/**
 * Allows the user to shuffle the order of the letters in the letter box.
 */
function shuffleLetters() {
    let letterBox = document.getElementById("box")
    // get the children of the parent element
    const tiles = Array.from(letterBox.children);
    // Fisher-Yates shuffle algorithm
    for (let i = tiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
    // append shuffled children back to the parent element
    tiles.forEach(tile => {
        letterBox.appendChild(tile);
    });
}


/** ---------- SOLUTION VALIDITY ---------- */ 


/**
 * Check whether the current solution is valid. If so, proceed to the next round.
 * 
 * The following conditions must be met before this can be done (and checked in the following order):
 *  (1) all letters have been placed on the board,
 *  (2) all letters are connected on the board,
 *  (3) in vertical and horizontal directions, valid words are formed.
 * 
 * If these conditions are met, we move to the next round.
 * If conditions are not met, the relevant error messaging it produced.
 */
async function checkRound() {
    if (CHECK_IS_RUNNING) {
        return;
    }
    CHECK_IS_RUNNING = true;

    if (!allLettersPlaced()) {
        CHECK_IS_RUNNING = false;
        return;
    }
    let letterGrid = generateLetterGrid()
    if (!isAllConnected(letterGrid)) {
        CHECK_IS_RUNNING = false;
        return;
    }
    let found = extractWords(letterGrid);
    let words = found[0];
    let indexes = found[1];
    let validWords = await allValidWords(words, indexes);
    if (!validWords) {
        CHECK_IS_RUNNING = false;
        return;
    }
    // if this point reached, valid solution
    // lock all the letters
    lockValidTiles(words, indexes)
    // save cookies up until this point
    //setCookie("save", storeProgressAsString(), 1);
    //setCookie("round", CURRENT_ROUND, 1);
    // move to the next round
    // 5 rounds must be completed before the game is finished
    setTimeout(function(){
        CHECK_IS_RUNNING = false;
        if (CURRENT_ROUND<4) {
            CURRENT_ROUND+=1;
            generateTiles(CURRENT_ROUND);
        }
        else {
            gameFinish();
        }
    }, 1500);
    
    
}

/**
 * Checks whether all the tiles have been placed on the grid. 
 * Grids are invalid if not all the letters have been used.
 * 
 * @returns {boolean} whether all the tiles have been placed
 */
function allLettersPlaced() {
    let letterBox = document.getElementById("box");
    if (letterBox.hasChildNodes()) {
        showInvalidMessage("All letters must be used.");
        return false;
    }
    return true;
}

/**
 * Check whether the letters in the grid are all connected.
 * 
 * @param {array[array[string]]} letterGrid - a grid of letters representing the current round solution
 * @returns {boolean} whether all the letters are connected in the grid
 */
function isAllConnected(letterGrid) {
    // Step 1: Identify active cells
    const activeCells = [];
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (letterGrid[i][j] != null) {
                activeCells.push([i, j]);
            }
        }
    }
    // Step 2: Build graph
    const graph = {};
    activeCells.forEach(cell => {
        const [x, y] = cell;
        graph[cell] = [];
        // Check neighbouring cells
        const neighbors = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        neighbors.forEach(([dx, dy]) => {
            const nx = x + dx;
            const ny = y + dy;
            if (letterGrid[nx] && letterGrid[nx][ny] != null) {
                graph[cell].push([nx, ny]);
            }
        });
    });
    // Step 3: DFS traversal
    const visited = new Set();
    function dfs(node) {
        visited.add(node.toString());
        graph[node].forEach(neighbour => {
            if (!visited.has(neighbour.toString())) {
                dfs(neighbour);
            }
        });
    }
    // Start DFS from an arbitrary active cell
    if (activeCells.length > 0) {
        dfs(activeCells[0]);
    }
    // Step 4: Check connectivity
    if(visited.size === activeCells.length) {
        return true;
    }
    showInvalidMessage("Letters must be all connected.");
    return false;
}

/**
 * Check whether all the words in the grid are valid.
 * 
 * @param {array[string]} words - a list of words to check whether valid.
 */
async function allValidWords(words, indexes) {
    let validity = []
    for (let i = 0, word; i < words.length; i++) {
        word = words[i]
        if (VALID_WORDS_CACHE.includes(word)) {
            validity.push(true);
        }
        else {
            VALID_WORDS_CACHE.push(word);
            validity.push(await isValidWord(word));
        }
    }
    if (validity.every(Boolean)) {
        return true;
    }
    highlightIncorrect(words, indexes, validity);
    return false;
}

/**
 * Produces locking animation to valid tiles.
 * 
 * @param {*} indexes 
 */
function lockValidTiles(words, indexes) {
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
}


/** ---------- ^ UTILITY ^ ---------- */ 


/**
 * Looks at the current round and creates a 2D array of all the letter positions.
 * This helps with analysing the validity of the solutions, since all that matters is the
 * letters and their positions on the grid.
 * 
 * @returns {array[array[string]]} 2D array of letters representing the round solution
 */
function generateLetterGrid() {
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
    return convertTo2DArray(letters);
}

/**
 * Converts a 1D array into a 2D array given the dimensions of the desired 2D array.
 * 
 * @param {array[string]} flatArray - the 1D array to be converted to 2D
 * @param {number} rows - the number of rows in the desired 2D array (default to 8)
 * @param {number} cols - the number of columns in the desired 2D array (default to 8)
 * @returns {array[array[string]]} 2D version of passed flatArray
 */
function convertTo2DArray(flatArray, rows=8, cols=8) {
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

/**
 * Shows a message to the user indicating something is invalid in their solution.
 * 
 * @param {*} messageContent - the message which should appear
 */
function showInvalidMessage(messageContent) {
    let errorBox = document.getElementById("message-box");
    let message = document.createElement('div');
    message.textContent = messageContent;
    message.setAttribute("class", "message");
    errorBox.insertBefore(message, errorBox.firstChild);

    message.addEventListener('animationend', function() {
        message.remove();
    }, { once: true });
}

/**
 * Finds all the words in the letters grid.
 * Not only returns the words, but also the indexes of each of the words found.
 * The words are simply an array of strings.
 * The indexes are more complex. Each word has a position, which consists of a 
 * 0) a direction (vertical or horizontal) 
 * 1) row/column index
 * 2) starting index in row/column
 * 3) ending index in row/column
 * 
 * @param {array[array[string]]} letterGrid - {array[array[string]]} 2D array of letters representing the round solution
 * @returns {array[array[string], array[number]]} word and corresponding index data
 */
function extractWords(letterGrid) {
    let size = letterGrid.length;
    let validH = convertTo2DArray(Array(size*size).fill(false), size, size);
    let validV = convertTo2DArray(Array(size*size).fill(false), size, size);
    // First, we check whether each position is horizontally/vertically valid.
    // A position is valid in a direction if it is adjacent to other letters.
    for (let i=0; i<size; i++) {
        for (let j=0; j<size; j++) {
            if (letterGrid[i][j]!=null) {

                // check for horizontal neighbours
                if ((j-1!=-1 && letterGrid[i][j-1]!=null) || (j+1!=size && letterGrid[i][j+1]!=null)) {
                    validH[i][j] = true;
                }
                // check for vertical neighbours
                if ((i-1!=-1 && letterGrid[i-1][j]!=null) || (i+1!=size && letterGrid[i+1][j]!=null)) {
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
        row = letterGrid[i];
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
            col.push(letterGrid[j][i]);
            valid.push(validV[j][i]);
        }
        found = lineExtractWords(col, valid, i, 'col');
        words = words.concat(found[0]);
        indexes = indexes.concat(found[1]);
    }
    return [words, indexes];
}

/**
 * Extracts all the words within a single line (a column or row).
 * 
 * @param {array[string]} line - the ar
 * @param {array[boolean]} valid - the indexes of valid words
 * @param {number} index - the index of the column or row
 * @param {string} direction - whether a column or row
 * @returns {array[words], array[number]}
 */
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


/**
 * Checks whether the word is a valid English word.
 * @param {string} word - word to be checked
 * @returns {boolean} - whether the word is valid.
 */
async function isValidWord(word) {
    word = word.toLowerCase();
    const url_1 = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
    const response_forward = await fetch(url_1, {
        method: "GET"
    })
    if (response_forward.status < 300) {
        return true;
    }
    reversed_word = word.split("").reverse().join("");
    const url_2 = `https://api.dictionaryapi.dev/api/v2/entries/en/${reversed_word}`
    const response_backward = await fetch(url_2, {
        method: "GET"
    })
    if (response_backward.status < 300) {
        return true;
    }
    return false;

    /** 
    word = word.toLowerCase();
    for (let i = 0, dict_word; i < ENGLISH_DICT.length; i++) {
        dict_word = ENGLISH_DICT[i];
        let n = dict_word.length;
        if (n != word.length) {
            continue;
        }
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
    */
}

/**
 * 
 * @param {*} indexes 
 * @param {*} validity 
 */
function highlightIncorrect(words, indexes, validity) {
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

/**
 * Converts a (direction, index, start, end) index into a coordinate on the grid.
 * @param {array} index - (direction, index, start, end)
 * @returns {array} coordinate on grid
 */
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

/**
 * Stores all the grid data into a string to be stored in a cookie.
 * 
 * @returns {string} positions of all the tiles placed
 */
function storeProgressAsString() {
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


/** ---------- FINISH ---------- */ 


/**
 * Function which runs when the game has been completed. Involves displaying confetti falling and the popup.
 */
function gameFinish() {
    confetti.start();

    setTimeout(function(){
        openPopup();
    }, 1000);

    setTimeout(function(){
        confetti.stop();
    }, 5000);
}

/**
 * Opens the popup showing the game is finished.
 */
function openPopup() {
    let messageBox = document.getElementById("message-box");
    messageBox.style.backgroundColor= "rgba(100, 100, 100, 0.8)";
    messageBox.style.pointerEvents = "auto";
    let finish = document.getElementById("finish");
    finish.style.display = "flex";
}

/**
 * Closes the popup showing the game is finished.
 */
function closePopup() {
    let messageBox = document.getElementById("message-box");
    messageBox.style.backgroundColor = "rgba(100, 100, 100, 0)";
    messageBox.style.pointerEvents = "none";
    let finish = document.getElementById("finish");
    finish.style.display = "none";
}


/** ---------- leftovers ---------- */ 


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




