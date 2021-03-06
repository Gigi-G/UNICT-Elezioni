import { Info, Candidato, schede, elettori, seggi, query, candidati } from './parser.model';
import { FormatName } from './FormatName';
const pdf2table = require('pdf2table');
const fs = require('fs');

class Parser {
    private info: Info;
    private doc: Target;
    private fileName: string;
    private newList: boolean;
    private idxList: number;

    constructor(fileName: string, dip: any) {
        this.fileName = fileName;

        this.info = {
            schede: {},
            liste: [],
            eletti: [],
            non_eletti: []
        }

        this.idxList = -1;

        this.newList = false;

        switch (dip) {
            case 0:
                this.doc = new Dipartimento;
                break;
            default:
                this.doc = new Organo();
                break;
        }
    }

    private write(): void {
        const data = JSON.stringify(this.info, null, 4);
        fs.writeFile(this.fileName.replace('.pdf', '') + '.json', data, (errW: any) => {

            if (errW) {
                throw errW;
            }

            console.log('JSON data is saved.');
        });
    }

    private searchPerc(el: any[]): number {
        return el.findIndex(e => e.includes(elettori.PERC));
    }

    private extractPerc(el: any[]) {

        const idxPerc = this.searchPerc(el);

        if (idxPerc != -1) {
            this.info.perc_votanti = el[idxPerc + 1];
        }
    }

    private extractPeople(el: any[], eletto: boolean): void {
        // idxList is 0 the first time that this condition is true
        let name = "";
        let indexVoti = 0;
        for(let i = 0; i<el.length; i++) {
            if(!isNaN(parseInt(el[i]))) break;
            name += (el[i] + " "); 
            ++indexVoti;
        }
        name = name.trim();
        const candidato: Candidato = {
            nominativo: name,
            voti: el[indexVoti],
            lista: this.info.liste[this.idxList].nome
        };

        (eletto) ? this.info.eletti.push(candidato) : this.info.non_eletti.push(candidato)

    }
    private isEndList(el: any[]): boolean {
        return el[0].includes(seggi.SCRUTINATI);
    }

    private extractCandidati(data: any[]): void {

        let idxB = this.searchListRef(data);

        while (!this.isMatch(data[idxB][0])) {
            idxB++;
        }

        let candidato = idxB + 2;

        while (!data[candidato][0].includes(query.END) && !this.isEndList(data[candidato])) {
            if (this.doc.isEletto(data[candidato])) {
                this.extractPeople(data[candidato], true);
            }
            else {
                this.extractPeople(data[candidato], false);
            }
            candidato++;
        }
        this.newList = false;
    }

    private searchListRef(data: any[]): number {
        return data.findIndex(e => this.isEndList(e));
    }

    private isMatch(el: string): boolean {
        let match = true;
        el = FormatName.formatNamesLists(el);
        let s1 = this.info.liste[this.idxList].nome.split(" ");
        let s2 = el.split(" ");
        if(s1.length < s2.length || s1.length > s2.length) return false;
        for(let i=0; i<s2.length && match; ++i) {
            s1[i] = s1[i].trim().replace("‐", "-");
            s2[i] = s2[i].trim().replace("‐", "-");
            match = (s1[i] == s2[i]); 
        }
        return match;
    }

    private extractSchede(el: any[]): void {
        switch (el[0]) {
            case schede.BIANCHE:
            case schede.NULLE:
            case schede.CONTESTATE:
                this.info.schede[el[0]] = el[1];
                break;
            case elettori.TUTTI:
                this.info.elettori = el[1];
                break;
            case elettori.VOTANTI:
                this.info.votanti = el[1];
                break;
        }
    }

    private extractQuoziente(el: any[]): void {
        if (el[0].includes(elettori.QUOZIENTE)) {
            this.info.quoziente = el[1];
        }
    }

    public scrape(): void {
        fs.readFile(this.fileName, (errR: any, buffer: any) => {

            if (errR) {
                return console.log(errR);
            }

            pdf2table.parse(buffer, (errP: any, data: any[]) => {

                if (errP) {
                    return console.log(errP);
                }

                this.doc.scrapeLists(this.info, data);

                data.forEach((el: any[]) => {
                    if (this.isEndList(el)) {
                        this.idxList++;
                        this.newList = true;
                    }

                    if (this.info.liste[this.idxList] && this.newList) {
                        this.extractCandidati(data)
                    }

                    this.extractSchede(el);
                    this.extractPerc(el);
                    this.extractQuoziente(el);

                });
                this.write();
            });
        });
    }
}

interface Target {
    scrapeLists(info: Info, data: any[]): void;
    isEletto(data: string[]): boolean;
}

class Dipartimento implements Target {

    public isEletto(data: string[]): boolean {
        return !!data.find(e => e === candidati.ELETTO_DIP);
    }

    public scrapeLists(info: Info, data: any[]): void {

        info.seggi_da_assegnare = data[1][1];

        let next = NaN;

        for (let i = 0; i < data.length; i++) {

            if (data[i][0].includes(query.DIPARTIMENTO)) {
                info.dipartimento = data[++i][0];
            }

            if (data[i][0].includes(candidati.LISTE_DIP)) {
                i = i + 2;
                while (!data[i][0].includes(candidati.VOTI) && !data[i][0].includes(schede.BIANCHE)) {

                    let name = "";
                    let k;
                    for(k = 0; k<data[i].length; k++) {
                        if(!isNaN(parseInt(data[i][k]))) break;
                        name += (FormatName.formatNamesLists(data[i][k]) + " ");
                    }

                    const tmp = {
                        nome: name.trim(),
                        voti_totali: 0
                    }

                    let brk = false; 
                    for(let j = k; j<data[i].length; j++) {
                        tmp.voti_totali = parseInt(data[i][j]);
                        if(!isNaN(tmp.voti_totali)) {
                            if(isNaN(next) || next == tmp.voti_totali) {
                                if(data[i][data[i].length-1] == data[i][j])
                                    next = parseInt(data[i][data[i].length-2]);
                                else
                                    next = parseInt(data[i][data[i].length-1]);
                                brk = true;
                                break;
                            }
                        }
                    }

                    if(!brk) {
                        tmp.voti_totali = parseInt(data[i][k]);
                    }

                    info.liste.push(tmp);
                    i++;
                }
            }
        }
    }
}

class Organo implements Target {

    public isEletto(data: string[]): boolean {
        return !!data.find(e => e === candidati.ELETTO_ORG);
    }

    public scrapeLists(info: Info, data: any[]): void {

        info.seggi_da_assegnare = data[1][2];

        for (let i = 0; i < data.length; i++) {

            if (data[i][0].includes(query.ORGANI)) {
                info.organo = data[i][0];
            }

            if (data[i][0].includes(candidati.LISTE_ORG)) {
                while (!data[++i][0].includes(candidati.VOTI) && !data[i][0].includes(schede.BIANCHE)) {

                    const tot = data[i].reduce((acc, pilot) => acc + pilot.length, 0);

                    const tmp = {
                        nome: FormatName.formatNamesLists(data[i][0]),
                        voti_totali: 0
                    }

                    if (tot < 120) {
                        tmp.voti_totali = parseInt(data[i][1]);
                    }

                    else {
                        tmp.voti_totali = parseInt(data[i][3]);
                    }

                    info.liste.push(tmp);
                }
            }
        }
    }
}

const fileName = process.argv[2];
const mode = parseInt(process.argv[3]);
const creator = new Parser(fileName, mode);
creator.scrape();