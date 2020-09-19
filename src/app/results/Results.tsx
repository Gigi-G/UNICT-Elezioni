import React, { useEffect, useState } from 'react';
import './Results.scss';
import Collapse from 'react-bootstrap/Collapse';
import Table from 'react-bootstrap/Table';

interface Props {
  anno?: string;
  path?: string;
}

const Results = (props: Props) => {
  const data = require(`../../data/${props.anno}/${props.path}.json`);
  const [show, setShow] = useState(false);

  function generateTableRows(data: any): JSX.Element[] {

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
        <tr key={`${props.anno}-${i}`}>
          <td></td>
          {Object.keys(results).map(l => 
            <td key={`${props.anno}-${l}-${i}`}>

              {(results[l] && results[l][i]) ? (
                [
                  `${results[l][i].nominativo} (${results[l][i].voti})`,
                  results[l][i].eletto ? (<img key={`coccarda-${i}`} src="coccarda.png" alt="eletto" width="16" height="30" className="float-right" />) : ''
                ]
              ) : ''}

            </td>
          )}
        </tr>
      )
    }

    return tableRows;
  }

  function generateHead(): JSX.Element {
    return (
        <thead>
        <tr
          onClick={toggleBody}
          aria-controls="example-collapse-text"
          aria-expanded={show}
        >
          <th className="year">{props.anno} </th>
          { data.liste.map((l: any) =>
          <th key={props.anno + '-lista-' + l.nome}>
            <img src={`loghi/${l.nome.replace('#', '')}.jpg`} width="80" height="80" alt={l.nome}></img>
            <p></p>
            {l.nome} ({l.voti_totali})
          </th>) }
        </tr>
      </thead>
    );
  }

  function toggleBody(e: any) {
    e.preventDefault();
    setShow(!show);
  }

  useEffect(() => {}, [show]);

  return (
    <div className="Results">
      <div className="container-fluid">

        <div className="row">
          <div className="col-12">
            {/* <h2>Dipartimento: {data.dipartimento}</h2> */}

            <div className={show ? 'invisible' : 'visible'}>
              <Collapse in={!show}>
                <Table striped bordered hover className="liste mt-4">
                  {generateHead()}
                </Table>
              </Collapse>
            </div>

              <Collapse in={show}>
                <div id="example-collapse-text">
                  <Table striped bordered hover className="liste mt-4">
                    {generateHead()}
                    <tbody>
                      {generateTableRows(data)}
                    </tbody>
                  </Table>
                </div>
              </Collapse>

          </div>
        </div>

        <br />
        <br />

      </div>
    </div>
  );
}

export default Results;
