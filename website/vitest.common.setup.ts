import { http } from 'msw';
import type { RequestHandler, WebSocketHandler } from 'msw';


export const ASTRO_SERVER_URL = '/api';
export const DUMMY_BACKEND_URL = 'http://backend.dummy';
export const DUMMY_LAPIS_URL = 'http://lapis.dummy';


type MSWWorkerOrServer = {
  use: (...handlers: (RequestHandler | WebSocketHandler)[]) => void;
};

export class RouteMocker {
    constructor(private workerOrServer: MSWWorkerOrServer) {}

    mockReferenceGenome() {
        this.workerOrServer.use(
          http.get(`${DUMMY_LAPIS_URL}/sample/referenceGenome`, () =>
            Response.json({ nucleotideSequences: [{ name: 'main', sequence: 'ATGC' }], genes: [] })
          )
        );
      }

    mockLineageDefinition() {
        this.workerOrServer.use(
            http.get(`${DUMMY_LAPIS_URL}/sample/lineageDefinition/dummy`, () => 
            Response.json({
                "A": {
                  "aliases": [
                    "a"
                  ]
                },
                "A.1": {
                  "parents": [
                    "A"
                  ],
                  "aliases": [
                    "a.1"
                  ]
                },
                "A.11": {
                  "parents": [
                    "A"
                  ],
                  "aliases": [
                    "a.11"
                  ]
                }}))
        )
    }

    mockAggregated() {
        this.workerOrServer.use(
            http.post(`${DUMMY_LAPIS_URL}/sample/aggregated`, () => 
            Response.json(
                {
                    data: [
            {
                "count": 1364,
                "pangoLineage": "A"
              },
              {
                "count": 2981,
                "pangoLineage": "A.1"
              },
              {
                "count": 10,
                "pangoLineage": "A.11"
              }]}))
        )
    }
    
    mockFooBar() {
        this.workerOrServer.use(
            http.get("http://foo.bar/", () => Response.json({ message: "Hello World" }))
        );
    }

}