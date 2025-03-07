

/** ---------- OBJECTS ---------- */


class Word {
    /**
     * @param {string} word - the word represented
     * @param {string} direction - whether the word is on a row or column ("row"/"col")
     * @param {integer} lineIndex - the index of the row or column
     * @param {integer} startIndex - the starting index on the row or column
     * @param {integer} endIndex - the ending index on the row or column
     */
    constructor(word, direction, lineIndex, startIndex, endIndex) {
        // attributes
        this.word = word;
        this.direction = direction;
        this.lineIndex = lineIndex;
        this.startIndex = startIndex;
        this.endIndex = endIndex;
        this.isValid = null;
        // methods
        this.setValidity = function(validity) {
            this.isValid = validity;
        };
    }
}


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
    ["#F7D155", "#C9A83B"],
    ["#B8E18E", "#7FB545"],
    ["#BDD8EF", "#849CAE"],
    ["#DED0EB", "#A595B7"],
    ["#F0CCCC", "#B48D8D"]
];
const GLOBAL_RNG = generateGlobalRNG();
const LETTERS =  generateLetters();
const VALID_WORDS_CACHE = [];
let CURRENT_ROUND;
let BLOCK_CHECK = false;


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
            CURRENT_ROUND = roundsCompletedIndex;
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
 * @param {integer} roundIndex - the round index to which tiles should be made
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
 * @param {string} savedTileData the positions of each tile in json format.
 */
function moveTilesToSavedPositions(savedTileData) {
    let tilePositions = JSON.parse(savedTileData);
    let tile, slot, round;
    tilePositions.forEach(position => {
        tile = document.getElementById(position[0]);
        round = parseInt(tile.getAttribute("round"));
        tile.setAttribute('draggable', "false");
        tile.style.backgroundColor = LOCKED_COLOURS[round][0];
        tile.style.boxShadow = "0px -4px inset " + LOCKED_COLOURS[round][1];
        slot = document.getElementById(position[1]);
        slot.appendChild(tile);
    });
}


/** ---------- ^ UTILITY ^ ---------- */ 


/**
 * Randomly generates true or false with certain probability.
 * That is, generates single Bernoulli trial outcome.
 * 
 * @param {float} p - probability of success,
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
 * @param {integer} n - the number of elements to take in subset
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
    if (BLOCK_CHECK) {
        return;
    }
    BLOCK_CHECK = true;

    if (!allLettersPlaced()) {
        BLOCK_CHECK = false;
        return;
    }
    let letterGrid = generateLetterGrid()
    if (!isAllConnected(letterGrid)) {
        BLOCK_CHECK = false;
        return;
    }
    let foundWords = extractWords(letterGrid);
    await setAllWordsValidity(foundWords);
    if (!allWordsAreValid(foundWords)) {
        BLOCK_CHECK = false;
        highlightIncorrect(foundWords);
        return;
    }
    // if this point reached, valid solution
    // lock all the letters
    lockValidTiles(foundWords)
    // save cookies up until this point
    setCookie("save", storeProgressAsString(), 1);
    setCookie("round", CURRENT_ROUND, 1);
    // move to the next round
    // 5 rounds must be completed before the game is finished
    setTimeout(function(){
        BLOCK_CHECK = false;
        if (CURRENT_ROUND<4) {
            CURRENT_ROUND+=1;
            generateTiles(CURRENT_ROUND);
        }
        else {
            BLOCK_CHECK = true;
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
 * Assigns the validity to each found word.
 * 
 * @param {array[Word]} foundWords - the list of words to assign validity
 */
async function setAllWordsValidity(foundWords) {
    for (let i = 0, wordObj; i < foundWords.length; i++) {
        wordObj = foundWords[i];
        if (VALID_WORDS_CACHE.includes(wordObj.word)) {
            wordObj.setValidity(true);
        }
        else {
            result = await isValidWord(wordObj.word);   
            wordObj.setValidity(result);
            if (result == true) {
                VALID_WORDS_CACHE.push(wordObj.word);
            }
        }
    }
}

/**
 * The following function determines whether all the words in a words list are valid.
 * 
 * @param {array[Word]} foundWords - the list of words to determine if valid
 * @returns {boolean}
 */
function allWordsAreValid(foundWords) {
    for (let i = 0; i < foundWords.length; i++) {
        if (!foundWords[i].isValid) {
            return false;
        }
    }
    return true;
}

/**
 * Produces locking animation to all valid tiles.
 * 
 * @param {array[Word]} foundWords - list of words to lock
 */
function lockValidTiles(foundWords) {
    let slotIDs = [];
    foundWords.forEach(wordObj => {
        slotIDs = slotIDs.concat(indexToIDConverter(wordObj));
    })
    slotIDs = [...new Set(slotIDs)];
    let tiles = [];
    for (let i = 0, tile, slot; i < slotIDs.length; i++) {
        slot = document.getElementById("slot"+String(slotIDs[i]))
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
 * @param {integer} rows - the number of rows in the desired 2D array (default to 8)
 * @param {integer} cols - the number of columns in the desired 2D array (default to 8)
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
 * @param {string} messageContent - the message which should appear
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
 * Finds all the words in the letters grid, and generates Word objects for each word.
 * 
 * @param {array[array[string]]} letterGrid - {array[array[string]]} 2D array of letters representing the round solution
 * @returns {array[Word]} - list of words (as Word objects) found in grid
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
    let allFoundWords = [];
    // find horizontal words
    for (let i=0, directionFoundWords; i<size; i++) {
        directionFoundWords = lineExtractWords(letterGrid[i], validH[i], i, 'row');
        allFoundWords = allFoundWords.concat(directionFoundWords);
    }
    // find vertical words
    for (let i=0, col, valid, directionFoundWords; i<size; i++) {
        col=[];
        valid = [];
        for (let j=0; j<size; j++) {
            col.push(letterGrid[j][i]);
            valid.push(validV[j][i]);
        }
        directionFoundWords = lineExtractWords(col, valid, i, 'col');
        allFoundWords = allFoundWords.concat(directionFoundWords);
    }
    return allFoundWords;
}

/**
 * Find the words on a single line (whether that be a column or row).
 * 
 * @param {array[string]} line - either a column or row from the letters grid
 * @param {array[boolean]} valid - whether each letter contributes to a word on the line
 * @param {integer} lineIndex - the index of the row/column
 * @param {integer} direction - whether the line is a row or column
 * @returns {array[Word]}
 */
function lineExtractWords(line, valid, lineIndex, direction) {
    let words = [];
    let currentLetters = [];
    let currentStartIndex = 0;
    let word;
    for (let i = 0; i < line.length; i++) {
        // check if we should add a word to the words. There are two situations to do this:
        // 1. We've hit an invalid slot but the currentWord is non-empty.
        // 2. We've reached the end of the grid and the currentWord is non-empty.
        if (!valid[i] && currentLetters.length != 0) {
            word = new Word(
                currentLetters.join(""), 
                direction, 
                lineIndex, 
                currentStartIndex, 
                i-1);
            words.push(word);
            currentLetters = [];
            currentStartIndex = i + 1;
        }
        if (i == line.length - 1 && currentLetters.length != 0) {
            currentLetters.push(line[i])
            word = new Word(
                currentLetters.join(""), 
                direction, 
                lineIndex,
                currentStartIndex, 
                i);
            words.push(word);
        }
        // valid letter
        else if (valid[i]) {
            currentLetters.push(line[i])
        }
        else {
            currentStartIndex = i + 1;
        }
    }
    return words;
}


/**
 * Checks whether the word is a valid word, by calling a dictionary API.
 * 
 * @param {string} word - word to be checked
 * @returns {boolean} - whether the word is valid.
 */
async function isValidWord(word) {
    word = word.toLowerCase();
    const url = `https://scrabble-dictionary-api-3c202cce44fe.herokuapp.com/validate-word/${word}`
    const response = await fetch(url, {
        method: "GET"
    })
    const data = await response.json();  // Parse the JSON content
    return (data.forwards || data.reversed)
}

/**
 * Highlights all the words that were invalid, by adding an animation.
 * 
 * @param {array[Word]} foundWords - list of words
 */
function highlightIncorrect(foundWords) {
    let invalidIDs = [];
    foundWords.forEach(wordObj => {
        if (!wordObj.isValid) {
            invalidIDs = invalidIDs.concat(indexToIDConverter(wordObj))
        }
    })
    invalidIDs = [...new Set(invalidIDs)];
    let tiles = [];
    for (let i = 0, tile, slot; i < invalidIDs.length; i++) {
        slot = document.getElementById("slot"+String(invalidIDs[i]))
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
 * Produces a list of slot IDs for a given a word object.
 * 
 * @param {Word} wordObj - the word to find the slot IDs for
 * @returns {array[string]} - list of slot IDs
 */
function indexToIDConverter(wordObj) {
    let tileIDs = [];
    for (let n = wordObj.startIndex, tileID; n < wordObj.endIndex + 1; n++) {
        if (wordObj.direction=="row") {
            tileID = (wordObj.lineIndex*8)+n;
        } else {
            tileID = (n*8)+wordObj.lineIndex;
        }
        tileIDs.push(tileID);
    }
    return tileIDs;
}

/**
 * Stores all the grid data into a string to be stored in a cookie.
 * The data is stored in JSON format. Each tile id is connected to a 
 * slot id.
 * 
 * The data is stored as a list of positions, each position an array with the tile id
 * in the first index, and its position in the second (slot id).
 * 
 * @returns {string} positions of all the tiles placed, json formatted
 */
function storeProgressAsString() {
    let tilePositions = [];
    let tiles = Array.prototype.slice.call( document.getElementsByClassName("tile") );
    let slot, position;
    tiles.forEach(tile => {
        slot = tile.parentElement;
        position = [tile.id, slot.id];
        tilePositions.push(position);
    });
    return JSON.stringify(tilePositions);
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
    createEmojiGrid();
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

/**
 * The following function produces an emoji grid which represents the player's solution.
 * The emoji grid is shown in the finished popup once the game has been completed.
 */
function createEmojiGrid() {
    const emojiCodes = ["🟨", "🟩", "🟦", "🟪", "🟥", "⬜"];

    let emojiRowHTML;
    let emojiRow;
    let slotID;
    let slot;
    let tile;
    let round;
    for (let i = 0; i < 8; i++) {
        emojiRowHTML = document.getElementById("emojiRow"+String(i));
        emojiRow = [];
        for (let j = 0; j < 8; j++) {
            slotID = 8*i + j;
            slot = document.getElementById("slot"+String(slotID));
            if (slot.hasChildNodes()) {
                tile = slot.childNodes[0];
                round = parseInt(tile.getAttribute("round"));
                emojiRow.push(emojiCodes[round]);
            } else {
                emojiRow.push(emojiCodes[5]);
            }
        }
        emojiRowHTML.textContent = emojiRow.join(" ")
    }
}




