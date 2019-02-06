$(document).ready(function() {
  attachListeners();
});

  var turn = 0;
  var currentGame = 0;

  const WIN_COMBINATIONS = [
    [0,1,2],  // Top Row
    [3,4,5],  // Middle Row
    [6,7,8],  // Bottom Row
    [0,4,8],  // Diagonal Right
    [2,4,6],  // Diagonal Left
    [0,3,6],  // Left Column
    [1,4,7],  // Middle Column
    [2,5,8]   // Right Column
  ];

  function player() {
    if (turn % 2 === 0) {
      return "X";
    } else {
      return "O";
    }
  }


  function doTurn(cell) {
    updateState(cell);
    turn++;
    if (checkWinner()) {
      saveGame();
      resetBoard();
    } else if (turn === 9) {
      setMessage("Tie game.");
      saveGame();
      resetBoard();
    }
  }

  function resetBoard() {
    $('td').empty();
    turn = 0;
    currentGame = 0;
  }

  function attachListeners() {
    $('table').on('click', function(e) {
      event = e.target;
      if (!$.text(event) && !checkWinner()) {
        doTurn(event);
      }
    })
    $('#save').on('click', () => saveGame());
    $('#previous').on('click', () => showPreviousGames());
    $('#clear').on('click', () => resetBoard());
  }

  function checkWinner() {
    let board = $("table tr td");
    let boardArray = [];
    let won = false;
    for(let i = 0; i < board.length; i++) {
      boardArray.push(board[i].textContent);
    }
    WIN_COMBINATIONS.forEach(function(win_combo) {
      let win_index_1 = win_combo[0];
      let win_index_2 = win_combo[1];
      let win_index_3 = win_combo[2];

      let position_1 = boardArray[win_index_1];
      let position_2 = boardArray[win_index_2];
      let position_3 = boardArray[win_index_3];

      if(position_1 === "X" && position_2 === "X" && position_3 === "X") {
        saveGame();
        setMessage("Player X Won!");
        won = true;
      } else if(position_1 === "O" && position_2 === "O" && position_3 === "O"){
        saveGame();
        setMessage("Player O Won!");
        won = true;
      } else if(!boardArray.includes("") && won === false) {
        saveGame();
        setMessage("Tie game.")
      }
    })
    return won;
  }

  function updateState(cell) {
    var token = player();
    $(cell).text(token);
  }

  function setMessage(message) {
    $("#message").html(`<h1>${message}</h1>`)
  }

  function saveGame() {
    var state = [];
    var gameData;

    $('td').text((index, cell) => {
      state.push(cell);
    });

    gameData = { state: state };

    if (currentGame) {
      $.ajax({
        type: 'PATCH',
        url: `/games/${currentGame}`,
        data: gameData
      });
    } else {
      $.post('/games', gameData, function(game) {
        currentGame = game.data.id;
        $('#games').append(`<button id="gameid-${game.data.id}">${game.data.id}</button><br>`);
        $("#gameid-" + game.data.id).on('click', () => reloadGame(game.data.id));
      });
    }
  }

  function showPreviousGames() {
    $('#games').empty();
    $.get('/games', (savedGames) => {
      if (savedGames.data.length) {
        savedGames.data.forEach(buttonizePreviousGame);
      }
    });
  }

  function buttonizePreviousGame(game) {
    $('#games').append(`<button id="gameid-${game.id}">${game.id}</button><br>`);
    $(`#gameid-${game.id}`).on('click', () => reloadGame(game.id));
  }

  function reloadGame(id) {
    document.getElementById('message').innerHTML = '';

    const xhr = new XMLHttpRequest;
    xhr.overrideMimeType('application/json');
    xhr.open('GET', `/games/${id}`, true);
    xhr.onload = () => {
      const data = JSON.parse(xhr.responseText).data;
      const id = data.id;
      const state = data.attributes.state;

      let index = 0;
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
          document.querySelector(`[data-x="${x}"][data-y="${y}"]`).innerHTML = state[index];
          index++;
        }
      }

      turn = state.join('').length;
      currentGame = id;

      if (!checkWinner() && turn === 9) {
        setMessage('Tie game.');
      }
    };

    xhr.send(null);
  }
