
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
const directions = [[1,1],[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[-1,1],[0,1]];

export default class Board {
    constructor (n) {
        this.n = n;
        this.n_blank = 5;

        this.pieces = Array.matrix(n, 0);

        this.pieces[parseInt(n / 2) - 1][parseInt(n / 2)] = 1;
        this.pieces[parseInt(n / 2)][parseInt(n / 2) - 1] = 1;
        this.pieces[parseInt(n / 2) - 1][parseInt(n / 2) - 1] = -1;
        this.pieces[parseInt(n / 2)][parseInt(n / 2)] = -1;

        for(var i = 0; i < 5; i += 1) {
            while(1){
                var y = Math.floor(Math.random() * n);
                var x = Math.floor(Math.random() * n);
    
                if (this.is_blank_valid(y, x, n, this.pieces)){
                    this.pieces[y][x] = 2;
                    break;
                }
            }
        }
    }

    countDiff(color) {
        var count = 0;
        for (var y = 0; y < this.n; y += 1){
            for (var x = 0; x < this.n; x += 1){
                if (this.pieces[y][x] === color) {
                    count += 1;
                }
                if (this.pieces[y][x] === -color){
                    count -= 1;
                }
            }
        }
        return count;
    }

    countPlayers() {
        var p1_count = 0;
        var p2_count = 0;

        for (var y = 0; y < this.n; y += 1){
            for (var x = 0; x < this.n; x += 1){
                if (this.pieces[y][x] === 1) {
                    p1_count += 1;
                }
                if (this.pieces[y][x] === -1){
                    p2_count += 1;
                }
            }
        }
        return [p1_count, p2_count];
    }

    get_legal_moves(color) {
        var moves = [];
        for (var y = 0; y < this.n; y += 1){
            for (var x = 0; x < this.n; x += 1){
                if (this.pieces[y][x] === color) {
                    var newmoves = this.get_moves_for_square([y, x]);
                    moves = moves.concat(newmoves);
                }
            }
        }
        return moves;
    }

    has_legal_moves(color) {
        for (var y = 0; y < this.n; y += 1){
            for (var x = 0; x < this.n; x += 1){
                if (this.pieces[y][x] === color) {
                    const newmoves = this.get_moves_for_square([y, x]);
                    if (newmoves && newmoves.length > 0){
                        return true;
                    }
                }
            }
        }
        return false;
    }

    get_moves_for_square(square) {
        const y = square[0];
        const x = square[1];
        const color = this.pieces[y][x];

        if (color === 0 || color === 2 || color === -2){
            return null;
        }

        const moves = [];
        for (var i = 0; i < directions.length; i++){
            const d = directions[i];
            const move = this._discover_move(square, d);
            if (move) {
                moves.push(move);
            }
        }
        return moves;
    }

    execute_move(move, color) {
        var flips = [];

        for (var i = 0; i < directions.length; i++){
            const d = directions[i];
            const flip_arr = this._get_flips(move, d, color);
            flips = flips.concat(flip_arr);
        }

        for (var i = 0; i < flips.length; i++) {
            const y = flips[i][0];
            const x = flips[i][1];
            this.pieces[y][x] = color;
        }
    }

    _discover_move(origin, direction) {
        const y_ori = origin[0];
        const x_ori = origin[1];
        const color = this.pieces[y_ori][x_ori];
        var flips = [];

        const icr_moves = this._increment_move(origin, direction, this.n);
        for (var i = 0; i < icr_moves.length; i++){
            const y = icr_moves[i][0];
            const x = icr_moves[i][1];

            if (this.pieces[y][x] === 0) {
                if (flips.length > 0){
                    return [y, x];
                }
                else
                    return null;
            }
            else if (this.pieces[y][x] === color) {
                return null;
            }
            else if (this.pieces[y][x] === -color) {
                flips.push([y, x]);
            }
            else if (this.pieces[y][x] === 2 || this.pieces[y][x] === -2){
                return null;
            }
        }
    }

    _get_flips (origin, direction, color) {
        var flips = [origin];

        const icr_moves = this._increment_move(origin, direction, this.n);
        for (var i = 0; i < icr_moves.length; i++){
            const y = icr_moves[i][0];
            const x = icr_moves[i][1];

            if (this.pieces[y][x] === 0 || this.pieces[y][x] === 2 || this.pieces[y][x] === -2){
                return [];
            }
            if (this.pieces[y][x] === -color){
                flips.push([y, x]);
            }
            else if (this.pieces[y][x] === color && flips.length > 0) {
                return flips;
            }
        }
        return [];
    }

    _increment_move(move, direction, n) {
        var icr_moves = [];
        var cur_point = move;
        var next_point = [cur_point[0] + direction[0], cur_point[1] + direction[1]];

        while (next_point[0] >= 0 && next_point[0] < n && next_point[1] >= 0 && next_point[1] < n) {
            icr_moves.push(next_point);
            next_point = [next_point[0] + direction[0], next_point[1] + direction[1]];
        }
        return icr_moves;
    }

    is_blank_valid(y, x) {
        if (this.pieces[y][x] !== 0){
            return false;
        }

        if (y >= 1 && (this.pieces[y - 1][x] === 2 || this.pieces[y - 1][x] === -2)) {
            return false;
        }

        if (y < this.n - 1 && (this.pieces[y + 1][x] === 2 || this.pieces[y + 1][x] === -2)) {
            return false;
        }

        if (x >= 1 && (this.pieces[y][x - 1] === 2 || this.pieces[y][x - 1] === -2)) {
            return false;
        }

        if (x < this.n - 1 && (this.pieces[y][x + 1] === 2 || this.pieces[y][x + 1] === -2)){
            return false;
        }

        return true;
    }
}