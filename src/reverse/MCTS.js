import * as ort from 'onnxruntime-web';

const EPS = 1e-8;
const mulArrays = (arr1, arr2) => {
    return arr1.map((e, index) => e * arr2[index]);
}
const addArrays = (arr1, arr2) => {
    return arr1.map((e, index) => e + arr2[index]);
}
const divScalar = (arr1, d) => {
    return arr1.map((e, index) => e / d);
}


const sa_to_key = (s, a) => {
    const as = a.toString();
    return s + ',' + as;
}

export default class MCTS {
    constructor (game, nnet, args) {
        this.game = game;
        this.nnet = nnet;
        this.args = args;

        this.Qsa = {}; // stores Q values for s,a (as defined in the paper)
        this.Nsa = {}; // stores #times edge s,a was visited
        this.Ns = {}; // stores #times board s was visited
        this.Ps = {}; //stores initial policy (returned by neural net)

        this.Es = {}; // stores game.getGameEnded ended for board s
        this.Vs = {}; // stores game.getValidMoves for board s
    }

    async getActionProb(canonicalBoard) {
        for (var i = 0; i < this.args.numMCTSSims; i += 1) {
            await this.search(canonicalBoard);
        }

        const s = this.game.stringRepresentation(canonicalBoard);
        const counts = [];
        for (var a = 0; a < this.game.getActionSize(); a += 1){
            if (sa_to_key(s, a) in this.Nsa) {
                counts.push(this.Nsa[sa_to_key(s, a)]);
            }
            else {
                counts.push(0);
            }
        }

        const maxVal = Math.max.apply(null, counts);
        const bestAs  = [];
        const probs = [];
        for (var i = 0; i < counts.length; i += 1){
            probs.push(0);
            if (counts[i] === maxVal) {
                bestAs.push(i);
            }
        }
        const act = bestAs[Math.floor(Math.random() * bestAs.length)];
        probs[act] = 1;

        return probs;
    }

    async search(canonicalBoard) {
        const s = this.game.stringRepresentation(canonicalBoard);
        const flat_state = canonicalBoard.flat(2);

        if (!(s in this.Es)) {
            this.Es[s] = this.game.getGameEnded(canonicalBoard, 1);
        }
        if (this.Es[s] !== 0) {
            return -this.Es[s];
        }

        if (!(s in this.Ps)) {
            // Here inference using nnet
            const data = Float32Array.from(flat_state);
            const input_tensor = new ort.Tensor('float32', data, [1, 8, 8]);
            const res = await this.nnet.run({'input': input_tensor});

            this.Ps[s] = res.pi.data;
            const v = res.v.data;
            const valids = this.game.getValidMoves(canonicalBoard, 1);
            this.Ps[s] = mulArrays(this.Ps[s], valids);
            const sum_Ps_s = this.Ps[s].reduce((a, b) => a + b, 0);
            if (sum_Ps_s > 0) {
                this.Ps[s] = divScalar(this.Ps[s], sum_Ps_s);
            }
            else {
                this.Ps[s] = addArrays(this.Ps[s], valids);
                const sum_Ps_s_2 = this.Ps[s].reduce((a, b) => a + b, 0);
                this.Ps[s] = divScalar(this.Ps[s], sum_Ps_s_2);
            }

            this.Vs[s] = valids
            this.Ns[s] = 0
            return -v;
        }

        const valids = this.Vs[s];
        var cur_best = -Number.MAX_VALUE;
        var best_act = this.game.getActionSize();

        for (var a = 0; a < this.game.getActionSize(); a += 1){
            if (valids[a]) {
                var u = -Number.MAX_VALUE;
                if (sa_to_key(s, a) in this.Qsa) {
                    u = this.Qsa[sa_to_key(s, a)] + this.args.cpuct * this.Ps[s][a] * Math.sqrt(this.Ns[s]) / (1 + this.Nsa[sa_to_key(s, a)]);
                }
                else {
                    u = this.args.cpuct * this.Ps[s][a] * Math.sqrt(this.Ns[s] + EPS);
                }
                if (u > cur_best) {
                    cur_best = u;
                    best_act = a;
                }
            }
        }

        const next_a = best_act;
        const next_info = this.game.getNextState(canonicalBoard, 1, next_a);
        if (!next_info[0]){
            console.log(canonicalBoard, next_a);
            console.log(next_info[0], next_info[1]);
        }
        const next_s = this.game.getCanonicalForm(next_info[0], next_info[1]);

        const next_v = await this.search(next_s);

        if (sa_to_key(s, next_a) in this.Qsa) {
            this.Qsa[sa_to_key(s, next_a)] = (this.Nsa[sa_to_key(s, next_a)] * this.Qsa[sa_to_key(s, next_a)] + next_v) / (this.Nsa[sa_to_key(s, next_a)] + 1);
            this.Nsa[sa_to_key(s, next_a)] += 1;
        }
        else {
            this.Qsa[sa_to_key(s, next_a)] = next_v;
            this.Nsa[sa_to_key(s, next_a)] = 1;
        }
        this.Ns[s] += 1;
        return -next_v;
    }
}