import './Play.css';
import React from 'react';
import { useEffect, useState } from 'react';
import { Layout, Button } from 'antd';
import * as ort from 'onnxruntime-web';
import MCTS from '../../reverse/MCTS';
import ReverseGame from '../../reverse/ReverseGame';

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
const blankArr = Array.matrix(8, 0);

function PlayAI(){
    const [loading, setLoading] = useState(false);
    const [curBoard, setCurBoard] = useState(Array.matrix(8, 0));
    const [curPlayer, setCurPlayer] = useState(1);
    const [curCand, setCurCand] = useState(Array.matrix(8, 0));
    const [playerCounts, setPlayerCounts] = useState([2, 2]);
    const [winner, setWinner] = useState(0);
    const [session, setSession] = useState(undefined);
    const [doAI, setDoAI] = useState(false);
    const [processing, setProcessing] = useState(false);

    const [mcts, setMCTS] = useState(undefined);
    const [game, setGame] = useState(undefined);

    function initialize(n, session) {
        const game = new ReverseGame(n);
        const board = game.getInitBoard();
        const mcts = new MCTS(game, session, {'numMCTSSims': 50, 'cpuct': 1.0});
        setGame(game);
        setMCTS(mcts);
        setCurBoard(board);
    }

    function findValids(player, board) {
        const valids_flat = game.getValidMoves(board, player);
        var valids = Array.matrix(8, 0);
        var num_valid = 0;

        for (var y = 0; y < 8; y += 1) {
            for (var x = 0; x < 8; x += 1){
                if (valids_flat[8 * y + x] === 1){
                    valids[y][x] = 1;
                    num_valid += 1;
                }
            }
        }

        return [valids, num_valid]
    }

    function updateBoard(player, action) {
        const action_flat = 8 * action[0] + action[1];
        const next_info = game.getNextState(curBoard, player, action_flat);
        const new_board = next_info[0];
        const playerCounts = game.getPlayerCounts(new_board);

        setCurBoard(new_board);
        setPlayerCounts(playerCounts);
    }

    async function onClickItem(y, x){
        if (curCand[y][x] !== 1 || processing)
            return;

        setProcessing(true);
        setCurCand(blankArr);
        updateBoard(curPlayer, [y, x]);
        switchPlayer(curPlayer);
        setProcessing(false);
    }

    function switchPlayer(cur_player) {
        const next_player = -1 * cur_player
        setCurPlayer(next_player)
    }

    function checkEnd() {
        var is_end = false;
        var winner = game.getGameEndedForUI(curBoard);

        if (winner === 1){
            is_end = true;
            winner = 1;
        }

        if (winner === -1) {
            is_end = true;
            winner = -1;
        }

        return [is_end, winner];
    }

    async function selectByAI(){
        const can_Board = game.getCanonicalForm(curBoard, -1);
        const action_prob = await mcts.getActionProb(can_Board);
        const action = action_prob.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);

        var y = parseInt(action / 8);
        var x = action % 8;
        const wait = (timeToDelay) => new Promise((resolve) => setTimeout(resolve, timeToDelay));
        await wait(500);

        updateBoard(-1, [y, x]);
    }

    function resetGame() {
        setWinner(0);
        setPlayerCounts([2, 2]);
        setCurPlayer(1);
        initialize(8, session);
    }

    useEffect(() => {
        async function loadModel() {
            const session = await ort.InferenceSession.create('/az.onnx', {
                executionProviders: ['wasm']
              });
            setSession(session);
            initialize(8, session);
        }
        loadModel();
    }, []);

    useEffect(() => {
        async function forward() {
            var end_arr = checkEnd(curPlayer);
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
                if (curPlayer === 1){
                    setCurCand(valid_arr[0]);
                }
                else {
                    setDoAI(true);
                    //await selectByAI();
                    //switchPlayer(curPlayer);
                }
            }
            else {
                switchPlayer(curPlayer);
            }
        }
        if (game){
            forward();
        }
    }, [curBoard, curPlayer]);

    useEffect(() => {
        async function updateUsingAI() {
            await selectByAI();

            setDoAI(false);
            switchPlayer(curPlayer);
        }
        if (doAI) {
            updateUsingAI();
        }
    }, [doAI]);

    return(
        loading?
        <div /> : 
        <Content className="playContents">
            <div className="systemMessageGroup">
                <div className="systemMessage_left">
                    {`당신의 말 (●) 개수: ${playerCounts[0]}`}
                </div>
                <div className="systemMessage_right">
                    {`AI의 말 (○) 개수: ${playerCounts[1]}`}
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
                                                item === -1?
                                                <span className='player-white' /> :
                                                <>
                                                {
                                                    (item === 2 || item === -2)?
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
                        '당신의 차례입니다 ●' : 'AI의 차례입니다 ○'
                    }
                    </> : 
                    <>
                    {
                        winner === 1?
                        '당신의 승리입니다!' : 'AI의 승리입니다!'
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

export default PlayAI;