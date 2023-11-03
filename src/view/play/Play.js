import './Play.css';
import React from 'react';
import { useEffect, useState } from 'react';
import { Layout, Button } from 'antd';

const { Content } = Layout;

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

function Play(){
    const [loading, setLoading] = useState(false);
    const [curBoard, setCurBoard] = useState(Array.matrix(8, 0));
    const [curPlayer, setCurPlayer] = useState(1);
    const [curCand, setCurCand] = useState(Array.matrix(8, 0));
    const [hps, setHps] = useState([10000, 10000]);
    const [winner, setWinner] = useState(0);

    function initialize(n) {
        var board = Array.matrix(8, 0);

        board[parseInt(n / 2) - 1][parseInt(n / 2)] = 1;
        board[parseInt(n / 2)][parseInt(n / 2) - 1] = 1;
        board[parseInt(n / 2) - 1][parseInt(n / 2) - 1] = 2;
        board[parseInt(n / 2)][parseInt(n / 2)] = 2;

        for(var i = 0; i < 5; i += 1) {
            while(1){
                var y = Math.floor(Math.random() * n);
                var x = Math.floor(Math.random() * n);
    
                if (isBlankValid(y, x, n, board)){
                    board[y][x] = -1;
                    break;
                }
            }

        }
        setCurBoard(board);
    }

    function isBlankValid(y, x, n, board) {
        if (board[y][x] !== 0){
            return false;
        }

        if (y >= 1 && board[y - 1][x] === -1) {
            return false;
        }

        if (y < n - 1 && board[y + 1][x] === -1) {
            return false;
        }

        if (x >= 1 && board[y][x - 1] === -1) {
            return false;
        }

        if (x < n - 1 && board[y][x + 1] === -1){
            return false;
        }

        return true;
    }

    function findValids(player, board) {
        var num_valid = 0;
        var valids = Array.matrix(8, 0);

        for (var y = 0; y < 8; y += 1) {
            for (var x = 0; x < 8; x += 1){
                if(board[y][x] === player) {
                    const start_point = [y, x];
                    for (var i = 0; i < directions.length; i++){
                        const d = directions[i];
                        const cand = candsToDirec(d, start_point, player, board);
                        if (cand){
                            num_valid += 1;
                            valids[cand[0]][cand[1]] = 1;
                        }
                    }
                }
            }
        }

        return [valids, num_valid]
    }

    function candsToDirec(d, p, player, board) {
        var available_flips = 0;
        var candidate = undefined;
        var cur_point = p;
        var next_point = cur_point;

        while (next_point[0] >= 0 && next_point[0] < 8 && next_point[1] >= 0 && next_point[1] < 8) {
            next_point = [cur_point[0] + d[0], cur_point[1] + d[1]];
            if (next_point[0] >= 0 && next_point[0] < 8 && next_point[1] >= 0 && next_point[1] < 8) {
                if (board[next_point[0]][next_point[1]] === player)
                    break;
                if (board[next_point[0]][next_point[1]] === -1)
                    break;
                if (board[next_point[0]][next_point[1]] === 0){
                    if (available_flips > 0)
                        candidate = next_point;
                    break
                }
                available_flips += 1;
                cur_point = next_point;
            }
            else
                break;
        }

        return candidate;
    }

    function updateBoard(player, action) {
        var new_board = curBoard.map(function(arr) {
            return arr.slice();
        });

        new_board[action[0]][action[1]] = player;

        var num_flips = 0;
        for (var i = 0; i < directions.length; i++){
            const d = directions[i];
            const flip_arr = getFlips(d, action, player, new_board);
            num_flips += flip_arr[1];
            for (var j = 0; j < flip_arr[0].length; j++){
                new_board[flip_arr[0][j][0]][flip_arr[0][j][1]] = player;
            }
        }

        var oppo_player = 2;
        if (player === 2){
            oppo_player = 1;
        }

        const dmg = calDmg(num_flips);
        var newHp = hps.slice();
        newHp[oppo_player - 1] -= dmg;
        setHps(newHp);
        setCurBoard(new_board);
    }

    function getFlips(d, p, player, board) {
        var available_flips = 0;
        var flips = [];
        var cur_point = p;
        var next_point = cur_point;

        while (next_point[0] >= 0 && next_point[0] < 8 && next_point[1] >= 0 && next_point[1] < 8) {
            next_point = [cur_point[0] + d[0], cur_point[1] + d[1]];
            if (next_point[0] >= 0 && next_point[0] < 8 && next_point[1] >= 0 && next_point[1] < 8) {
                if (board[next_point[0]][next_point[1]] === player)
                    break;
                if (board[next_point[0]][next_point[1]] === -1) {
                    available_flips = 0;
                    flips = [];
                    break;
                }
                if (board[next_point[0]][next_point[1]] === 0){
                    available_flips = 0;
                    flips = [];
                    break;
                }
                available_flips += 1
                flips.push(next_point);
                cur_point = next_point;
            }
            else {
                available_flips = 0;
                flips = [];
                break;
            }

        }
        return [flips, available_flips]
    }

    function calDmg(num) {
        const dmg_list = [0, 100, 210, 330, 500, 680, 800];
        var dmg = 0;

        if (num < 7){
            dmg = dmg_list[num];
        }
        else {
            dmg = 140 * num;
        }
        return dmg;
    }

    function onClickItem(y, x){
        if (curCand[y][x] !== 1)
            return;

        updateBoard(curPlayer, [y, x]);
        switchPlayer(curPlayer);
    }

    function switchPlayer(cur_player) {
        if (cur_player === 1) {
            setCurPlayer(2);
        }
        else {
            setCurPlayer(1);
        }
    }

    function checkEnd() {
        var is_end = false;
        var winner = 0;

        if (hps[0] <= 0){
            is_end = true;
            winner = 2;
            return [is_end, winner];
        }

        if (hps[1] <= 0){
            is_end = true;
            winner = 1;
            return [is_end, winner];
        }

        var valid_arr1 = findValids(1, curBoard);
        var valid_arr2 = findValids(2, curBoard);

        if (valid_arr1[1] === 0 && valid_arr2[1] === 0) {
            is_end = true;
            if (hps[0] < hps[1]) {
                winner = 2;
            }
            else if (hps[0] > hps[1]) {
                winner = 1;
            }
            else {
                winner = 0;
            }
        }

        return [is_end, winner];
    }

    function resetGame() {
        setWinner(0);
        setHps([10000, 10000]);
        setCurPlayer(1);
        initialize(8);
    }

    useEffect(() => {
        initialize(8);
    }, []);

    useEffect(() => {
        var end_arr = checkEnd();
        if (end_arr[0]) {
            setWinner(end_arr[1]);
            return;
        }

        var valid_arr = findValids(curPlayer, curBoard);
        var validTurn = true;
        if (valid_arr[1] === 0){
            validTurn = false;
        }
        if (validTurn) {
            setCurCand(valid_arr[0]);
        }
        else {
            switchPlayer(curPlayer);
        }
    }, [curBoard, curPlayer]);

    return(
        loading?
        <div /> : 
        <Content className="playContents">
            <div className="systemMessageGroup">
                <div className="systemMessage_left">
                    {`플레이어 1의 HP: ${hps[0]}`}
                </div>
                <div className="systemMessage_right">
                    {`플레이어 2의 HP: ${hps[1]}`}
                </div>
            </div>
            <div className="board">
                {
                    curBoard.map((row, ind1) => (
                        <div className="board-row">
                            {
                                row.map((item, ind2) => (
                                    <div className="board-element" onClick={() => onClickItem(ind1, ind2)}>
                                        {
                                            item === 1?
                                            <span className='player-black' /> :
                                            <>
                                            {
                                                item === 2?
                                                <span className='player-white' /> :
                                                <>
                                                {
                                                    item === -1?
                                                    <span className='hole' /> : 
                                                    <>
                                                    {
                                                        curCand[ind1][ind2] === 1?
                                                        <span className='cand' /> : <></>
                                                    }
                                                    </>
                                                }
                                                </>
                                            }
                                            </>
                                        }
                                    </div>
                                ))
                            }
                        </div>
                    ))
                }
            </div>
            <div className="systemMessage">
                {
                    winner === 0?
                    <>
                    {
                        curPlayer === 1?
                        '플레이어 1의 차례입니다 ●' : '플레이어 2의 차례입니다 ○'
                    }
                    </> : 
                    <>
                    {
                        winner === 1?
                        '플레이어 1의 승리입니다!' : '플레이어 2의 승리입니다!'
                    }
                    </>
                }
            </div>
            <div className="retryButton">
                <Button type="primary" size="large" onClick={resetGame}>
                    <span className="buttonText">
                    처음부터 다시 하기
                    </span>
                </Button>
            </div>
        </Content>
    );
}

export default Play;