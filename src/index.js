
function getFieldIndexes (row, field) {
  let result = [];
  for (let i = 0; i < row.length; i++) {
    if (row[i] === field) result.push(i);
  }
  return result;
}

function getRowValues (rowIndex, sudoku) {
  return sudoku[rowIndex]
}

function getColumnValues (columnIndex, sudoku) {
  return sudoku.map((row) => row[columnIndex])
}

function getBlockValues (rowIndex, columnIndex, sudoku) {
  const BLOCK_LENGTH = 3;

  let blockRowStartPos = BLOCK_LENGTH * (Math.floor(rowIndex / BLOCK_LENGTH));
  let blockColumnStartPos = BLOCK_LENGTH * (Math.floor(columnIndex / BLOCK_LENGTH));
  let result = [];

  for (let i = 0; i < BLOCK_LENGTH; i++) {
    for (let j = 0; j < BLOCK_LENGTH; j++) {
      result.push(sudoku[blockRowStartPos + i][blockColumnStartPos + j])
    }
  }

  return result;
}

const deleteEmptyFieldInArray = (function () {
  const EMPTY_FIELD = 0;

  return function (arr) {
    return arr.filter((item) => item !== EMPTY_FIELD);
  }
})()

function diff (arr1, arr2) {
  return arr1.filter((el) => arr2.indexOf(el) < 0);
}

function getFillEmptyArray (length, value) {
  let result = [];
  for (let i = 0; i < length; i++) {
    result.push(value);
  }
  return result;
}

function findCandidates (rowIndex, columnIndex, sudoku) {
  const UNIQUE_ROW = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  let rowValues = getRowValues(rowIndex, sudoku);
  let columnValues =  getColumnValues(columnIndex, sudoku);
  let blockValues =  getBlockValues(rowIndex, columnIndex, sudoku);
  
  rowValues =  deleteEmptyFieldInArray(rowValues);
  columnValues =  deleteEmptyFieldInArray(columnValues);
  blockValues = deleteEmptyFieldInArray(blockValues);

  rowValues = diff(UNIQUE_ROW, rowValues);
  columnValues = diff(rowValues, columnValues);
  blockValues = diff(columnValues, blockValues);

  return blockValues;
}

function isSolved(sudoku) {
  for (let i = 0; i < 9; i++) {
    let [r,c] = [Math.floor(i/3)*3,(i%3)*3];
    if (
        (sudoku[i].reduce((s,v)=>s.add(v),new Set()).size != 9) ||
        (sudoku.reduce((s,v)=>s.add(v[i]),new Set()).size != 9) ||
        (sudoku.slice(r,r+3).reduce((s,v)=>v.slice(c,c+3).reduce((s,v)=>s.add(v),s),new Set()).size != 9)
      ) return false;
    for (let j = 0; j < 9; j++) {
      if (sudoku[i][j] === 0) return false;
    }
  }

  return true;
}

function flat (array) {
  return array.reduce((acc, val) => acc.concat(val), []);
}

function getDublicateCount (array, element) {
  return array.filter((el) => el === element).length;
}

function getUnique (arr) {
  return arr.filter((element, index, array) => getDublicateCount(array, element) === 1 )
}

function getIndexOfCandidate (array = [], candidate) {
  let result = -1;

  array.forEach((el, index) => {
    if (el.includes(candidate)) result = index;
  })

  return result;
}

function getMinCandidate (candidatesMatrix) {
  let minCandidates = {
    row: -1,
    col: -1,
    candidates: []
  };

  for (let rowIndex = 0; rowIndex < candidatesMatrix.length; rowIndex++) {
    let row = candidatesMatrix[rowIndex]
    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      let item = candidatesMatrix[rowIndex][colIndex];
      if (
          item.length > 0 && 
          (minCandidates.candidates.length === 0 || item.length < minCandidates.candidates.length)
        ) {
        minCandidates = {
          row: rowIndex,
          col: colIndex,
          candidates: item
        }
      }
    }
  }

  return minCandidates;
}

let candidatesStack = [];

module.exports = function solveSudoku (matrix) {
  if (isSolved(matrix)) {
    return matrix;
  } else {
    let sudoku = matrix.map((r) => [...r]);
    const ONLY_ONE_CANDIDATE = 1;
    const EMPTY_FIELD = 0;
    
    let finded = false;
    let candidatesMatrix = [];
    
    // ищем единственное значение и заполняем матрицу кандидатов
    for (let rowIndex = 0; rowIndex < sudoku.length; rowIndex++) {
      candidatesMatrix.push(getFillEmptyArray(sudoku.length, []));
      let emptyFieldIndexes = getFieldIndexes(sudoku[rowIndex], EMPTY_FIELD);

      if (emptyFieldIndexes.length > 0 ) {
        for (let colIndex of emptyFieldIndexes) {
          let candidates = [...findCandidates(rowIndex, colIndex, sudoku, EMPTY_FIELD)];

          if (candidates.length === ONLY_ONE_CANDIDATE) {
            sudoku[rowIndex][colIndex] = candidates[0];
            finded = true;
          } else {
            candidatesMatrix[rowIndex][colIndex] = candidates;
          }
        }
      }
    }

    if (finded) return solveSudoku(sudoku);

    // ищем уникальное (1) значение среди кандидатов
    for (let matrixIndex = 0; matrixIndex < candidatesMatrix.length; matrixIndex++) {
      let rowCandidates = getRowValues(matrixIndex, candidatesMatrix);
      let colCandidates = getColumnValues(matrixIndex, candidatesMatrix);

      let uniqueRowCandidates = getUnique(flat(rowCandidates));
      let uniqueColCandidates = getUnique(flat(colCandidates));
      let rowIndex, colIndex, candidate;

      if (uniqueRowCandidates.length === 1) {
        candidate = uniqueRowCandidates[0];
        colIndex = getIndexOfCandidate(rowCandidates, candidate);
        rowIndex = matrixIndex;
        sudoku[rowIndex][colIndex] = candidate;        
        finded = true;
      }
      if (uniqueColCandidates.length === 1) {
        candidate = uniqueColCandidates[0];
        rowIndex = getIndexOfCandidate(colCandidates, candidate);
        colIndex = matrixIndex;
        sudoku[rowIndex][colIndex] = candidate;
        finded = true;
      }
    }

    if (finded) return solveSudoku(sudoku);
    else { // если кандидатов нет - проверяем другие возможные кандидаты из стека или делаем pop и ищем дальше
      const { row: rowIndex, col: colIndex, candidates } = getMinCandidate(candidatesMatrix);
      let copySudoku = sudoku.map((r) => [...r]);

      stackItem = {
        candidates,
        rowIndex,
        colIndex,
        indexOfCandidates: 0,
        sudoku: null
      }

      if (candidates.length > 0) {
        let indexOfCandidates = stackItem.indexOfCandidates;
        copySudoku[rowIndex][colIndex] = candidates[indexOfCandidates];
        stackItem.indexOfCandidates++
        stackItem.sudoku = copySudoku.map((r) => [...r]);
        candidatesStack.push({ ...stackItem, indexOfCandidates })
      } else {
        do {
          stackItem = candidatesStack.pop();
          copySudoku = stackItem.sudoku.map((r) => [...r]);
        } while (
          (stackItem.rowIndex < 0 &&
          candidatesStack.length > 0) ||
          stackItem.indexOfCandidates === stackItem.candidates.length
        )

        if (candidatesStack.length === 0 && stackItem.rowIndex < 0) throw new Error('Can not solve this Sudoku');

        const { rowIndex, colIndex, candidates } = stackItem;
        copySudoku[rowIndex][colIndex] = candidates[stackItem.indexOfCandidates++];
        stackItem.sudoku = copySudoku.map((r) => [...r])
        candidatesStack.push(stackItem);
      }

      return solveSudoku(copySudoku);
    }
  }
}