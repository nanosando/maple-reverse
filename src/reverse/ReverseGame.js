
import Board from "./ReverseLogic";

Array.matrix = function (n, initial) {
    var a, i, j, mat = [];
    for (i = 0; i < n; i += 1) {
        a = [];
        for (j = 0; j < n; j += 1) {
            a[j] = initial;
        }
        mat[i] = a;
    }
    return mat;
};

export default class ReverseGame {
    constructor (n) {
        this.n = n;
    }

    getInitBoard() {
        const b = new Board(this.n);

        return b.pieces;
    }

    getBoardSize() {
        return [this.n, this.n];
    }

    getActionSize() {
        return this.n * this.n + 1;
    }

    getNextState(board, player, action) {
        if (action === this.n * this.n) {
            return [board, -player];
        }
        var b = new Board(this.n);
        var board_copy = board.map(function(arr) {
            return arr.slice();
        });
        b.pieces = board_copy;

        const move = [parseInt(action / this.n), action % this.n];
        b.execute_move(move, player);

        return [b.pieces, -player];
    }

    getValidMoves(board, player){
        var b = new Board(this.n);
        var board_copy = board.map(function(arr) {
            return arr.slice();
        });
        b.pieces = board_copy;

        var valids = [];
        for (var j = 0; j < this.getActionSize(); j += 1) {
            valids[j] = 0;
        }

        const legalMoves = b.get_legal_moves(player);
        if (legalMoves.length === 0){
            valids[valids.length - 1] = 1;
            return valids;
        }
        
        for (var i = 0; i < legalMoves.length; i++){
            const y = legalMoves[i][0];
            const x = legalMoves[i][1];

            valids[this.n * y + x] = 1
        }
        return valids;
    }

    getGameEnded(board, player) {
        var b = new Board(this.n);
        var board_copy = board.map(function(arr) {
            return arr.slice();
        });
        b.pieces = board_copy;

        if (b.has_legal_moves(player)) {
            return 0;
        }
        if (b.has_legal_moves(-player)) {
            return 0;
        }
        if (b.countDiff(player) > 0) {
            return 1;
        }
        return -1;
    }

    // getGameEnded gives result in point of player(argument)'s view
    // This function is giving result by player number. 1 for player 1, -1 for player 2
    getGameEndedForUI(board) {
        var b = new Board(this.n);
        var board_copy = board.map(function(arr) {
            return arr.slice();
        });
        b.pieces = board_copy;

        if (b.has_legal_moves(1)) {
            return 0;
        }
        if (b.has_legal_moves(-1)) {
            return 0;
        }
        const num_players = b.countPlayers()
        if (num_players[0] > num_players[1]) {
            return 1;
        }
        else if (num_players[0] < num_players[1]){
            return -1;
        }
        else {
            return 0;
        }
    }

    getPlayerCounts(board) {
        var b = new Board(this.n);
        var board_copy = board.map(function(arr) {
            return arr.slice();
        });
        b.pieces = board_copy;

        return b.countPlayers();
    }

    getCanonicalForm(board, player) {
        var board_copy = board.map(function(arr) {
            return arr.slice().map(function(x) {return x * player});
        });

        return board_copy;
    }

    stringRepresentation(board) {
        const board_str = board.map(arr => arr.join('')).join('');
        return board_str;
    }

    getScore(board, player) {
        var b = new Board(this.n);
        var board_copy = board.map(function(arr) {
            return arr.slice().map(function(x) {return x * player});
        });
        b.pieces = board_copy;
        return b.countDiff(player);
    }
}