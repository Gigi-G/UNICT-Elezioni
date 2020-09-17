import React, { FunctionComponent, useEffect, useState, ReactNode } from 'react';
import './Results.scss';

interface Props {
  anno?: string;
  dipartimento?: string;
}

const Results = (props: Props) => {
  const dmi = require(`../../data/${props.anno}/dipartimenti/${props.dipartimento}.json`);
  const [show, setShow] = useState(false);

  function generateTableRows(data: any) {

    // init results
    const results: { [key: string]: any[] } = {}; // any -> eletti[]

    data.liste.forEach((l: any) => results[l.nome] = []);
    data.eletti.forEach((e: any) => results[e.lista].push(Object.assign(e, { eletto: true })));
    data.non_eletti.forEach((e: any) => results[e.lista].push(Object.assign(e, { eletto: false })));

    // get max rows count
    const maxRows = Object.values(results).reduce((acc, prev) => acc < prev.length ? prev.length : acc, 0);

    // generate tableRows
    const tableRows = [];
    for(let i = 0; i < maxRows; i++)  {
      tableRows.push(
        <tr key={i}>
          <td></td>
          {Object.keys(results).map(l =>
            <td key={l + '-' + i}>
              {(results[l] && results[l][i]) ? ([
                `${results[l][i].nominativo} (${results[l][i].voti})`,
                results[l][i].eletto ? (<img src="coccarda.png" alt="eletto" width="16" height="30" className="float-right" />) : ''
              ]) : ''}
            </td>)
          }
        </tr>
      )
    }

    return tableRows;
  }

  function toggleBody(e: any) {
    e.preventDefault();
    setShow(!show);
  }

  useEffect(() => {}, [show]);

  return (
    <div className="Results">
      <div className="container">

        <div className="row">
          <div className="col-12">
            {/* <h2>Dipartimento: {dmi.dipartimento}</h2> */}
            <table className="liste mt-4 table table-bordered table-striped">
              <thead>
                <tr onClick={toggleBody}>
                  <th className="year">anno: {props.anno} </th>
                  { dmi.liste.map((l: any) =>
                  <th key={l}>
                    <img src={`loghi/${l.nome}.jpg`} width="80" height="80" alt={l.nome}></img>
                    <p></p>
                    {l.nome} ({l.voti_totali})
                  </th>) }
                </tr>
              </thead>
              <tbody>
                {show ? generateTableRows(dmi) : ''}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Results;