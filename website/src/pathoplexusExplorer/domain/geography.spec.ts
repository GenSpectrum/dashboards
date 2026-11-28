import { expect, test } from 'vitest';

import {
    admin1AreaOf,
    canonicalCountryOf,
    continentOf,
    countryNamesOf,
    hasAdmin1Names,
    isAdmin1Of,
    parsePlace,
    placedCountryOf,
    placeKey,
    subregionOf,
} from './geography.ts';
import { defined } from '../test/defined.fixture.ts';

test('a country is counted under its current name, and an ocean is not a country', () => {
    expect(placedCountryOf('Zaire')).toBe('Democratic Republic of the Congo');
    expect(placedCountryOf('Pacific Ocean')).toBeUndefined();
    expect(placedCountryOf('not provided')).toBeUndefined();
    expect(placedCountryOf(null)).toBeUndefined();
});

test('places round-trip through their keys', () => {
    for (const key of ['', 'continent:Africa', 'subregion:Western Africa', 'country:Nigeria', 'admin1:Nigeria/Kano']) {
        expect(placeKey(defined(parsePlace(key), `'${key}' as a place`))).toBe(key);
    }
    expect(parsePlace('continent:Atlantis')).toBeUndefined();
});

test('a country sits in its region and continent', () => {
    expect(continentOf('Democratic Republic of the Congo')).toBe('Africa');
    expect(subregionOf('Democratic Republic of the Congo')).toBe('Middle Africa');
});

test.each([
    ['Argentina', 'Buenos Aires province', 'Provincia de Buenos Aires'],
    ['Argentina', 'Buenos Aires', 'Buenos Aires'],
    ['Argentina', 'Buenos Aires, La Plata', 'Provincia de Buenos Aires'],
    ['Argentina', 'DF, Buenos Aires', 'Ciudad de Buenos Aires'],
    ['Argentina', 'Capital Federal', 'Ciudad de Buenos Aires'],
    ['Argentina', 'Ciudad Autonoma de Buenos Aires', 'Ciudad de Buenos Aires'],
    ['USA', 'Illinois, Cook County', 'Illinois'],
    ['USA', 'Sacramento, California', 'California'],
    ['USA', 'Suffolk Co., NY', 'New York'],
    ['USA', 'Texas/Houston', 'Texas'],
    ['USA', 'NewYork', 'New York'],
    ['USA', 'Nebrsaka', 'Nebrsaka'],
    ['Switzerland', 'ZH', 'Zürich'],
    ['Switzerland', 'Basel-Landschaft', 'Basel-Land'],
    ['Venezuela', 'DF/Caracas', 'Distrito Capital'],
    ['Nigeria', 'FCT', 'Federal Capital Territory'],
    ['Ghana', 'Ashanti, Kumasi', 'Ashanti, Kumasi'],
])('a province is found in whichever part of the recorded value names it: %s, %s', (country, recorded, division) => {
    expect(admin1AreaOf(country, recorded)).toBe(division);
});

test.each([
    ['Indonesia', 'Jawa Barat', 'West Java'],
    ['Italy', 'EmiliaRomagna', 'Emilia-Romagna'],
    ['Thailand', 'Kampheang-Phet', 'Kamphaeng Phet'],
    ['South Africa', 'Kwa-Zulu Natal', 'KwaZulu-Natal'],
    ['Pakistan', 'Peshawer', 'Khyber Pakhtunkhwa'],
    ['Kenya', 'Kilifi District', 'Kilifi'],
    ['Germany', 'Bayern', 'Bavaria'],
    ['Democratic Republic of the Congo', 'province Kasai Oriental', 'Kasaï-Oriental'],
    ['Democratic Republic of the Congo', 'Sud-Kivu,Kamituga', 'Sud-Kivu'],
    ['Austria', 'Kärnten', 'Carinthia'],
    ['Mexico', 'CDMX.', 'Mexico City'],
    ['Mexico', 'Amatepec, Estado de Mexico', 'State of Mexico'],
    ['Chile', "Region del Libertador General Bernardo O'Higgins", "O'Higgins"],
    ['Russia', 'Kalmikia', 'Republic of Kalmykia'],
    ['Laos', 'Vientiane Capital, Saythany', 'Vientiane Capital'],
    ['Laos', 'Vientiane Province', 'Vientiane Province'],
    ['Laos', 'Xaysomboune', 'Xaisomboon'],
    ['Russia', 'Moscow region', 'Moscow Oblast'],
    ['Russia', 'MOW', 'Moscow City'],
    ['Russia', 'MOS', 'Moscow Oblast'],
    ['Russia', 'ALT', 'Altai Krai'],
    ['USA', 'Washington County, NY', 'New York'],
    ['USA', 'Washington, DC', 'District of Columbia'],
    ['USA', 'La_Jolla,California', 'California'],
    ['USA', 'Washington, Minnesota', 'Washington, Minnesota'],
    ['Brazil', 'RioBranco, AC', 'Acre'],
    ['USA', 'Washington County', 'Washington County'],
])('a division is found under the name the country records it by: %s, %s', (country, recorded, division) => {
    expect(admin1AreaOf(country, recorded)).toBe(division);
});

test.each([
    ['Italy', 'Ancona', 'Marche'],
    ['Spain', 'Barcelona', 'Catalonia'],
    ['United Kingdom', 'Liverpool', 'England'],
    ['Sierra Leone', 'Port Loko', 'North Western'],
    ['Bangladesh', 'Char Fasson, Bhola', 'Barisal'],
    ['Madagascar', 'Antsirabe I', 'Vakinankaratra'],
    ['Hungary', 'Szeged', 'Csongrád-Csanád'],
])(
    'a division below the one that a map draws is counted under the one it belongs to: %s, %s',
    (country, recorded, division) => {
        expect(admin1AreaOf(country, recorded)).toBe(division);
    },
);

test.each([
    ['Uganda', 'Kikuube district', 'Kikuube'],
    ['Uganda', 'Rubanda', 'Rubanda'],
    ['Uganda', 'Hoima City', 'Hoima City'],
    ['Uganda', 'Hoima District', 'Hoima District'],
    ['Indonesia', 'Tarakan', 'North Kalimantan'],
    ['Philippines', 'Sulu', 'Zamboanga Peninsula'],
    ['Philippines', 'Negros Oriental', 'Negros Island Region'],
    ['Nepal', 'Sarlahi', 'Madhesh'],
    ['Nepal', 'Birgunj, Parsa', 'Madhesh'],
])('records are assigned to their present-day division: %s, %s', (country, recorded, division) => {
    expect(admin1AreaOf(country, recorded)).toBe(division);
});

test.each([
    ['China', 'Guangzhou', 'Guangdong'],
    ['Japan', 'Osaka City', 'Ōsaka'],
    ['Brazil', 'Ribeirao Preto', 'São Paulo'],
    ['Brazil', 'Tocantins state (Palmas)', 'Tocantins'],
    ['Brazil', 'Valenca-RJ', 'Rio de Janeiro'],
    ['USA', 'Kansas City MO', 'Missouri'],
    ['USA', 'Kansas, Dodge City', 'Kansas'],
    ['Germany', 'Wuerzburg', 'Bavaria'],
    ['Colombia', 'Barranquilla', 'Atlántico'],
    ['Paraguay', 'Coronel Oviedo', 'Caaguazú'],
    ['Oman', 'Al Seeb', 'Muscat'],
    ['Saudi Arabia', 'Al-Sharafyia, Jeddah', 'Makkah'],
])(
    'a place inside a division is counted under it, but a division named beside it wins: %s, %s',
    (country, recorded, division) => {
        expect(admin1AreaOf(country, recorded)).toBe(division);
    },
);

test.each([
    ['Viet Nam', 'South', 'South'],
    ['Malaysia', 'Klang valley', 'Klang valley'],
    ['China', 'Suzhou', 'Suzhou'],
    ['United Kingdom', 'Great Britain', 'Great Britain'],
    ['France', 'Reunion', 'Reunion'],
    ['Chile', 'Easter Island', 'Easter Island'],
    // A village, or a lake shared by several counties.
    ['Hungary', 'Balaton', 'Balaton'],
    ['Myanmar', 'Burma', 'Burma'],
    ['Laos', 'Vientiane', 'Vientiane'],
    ['Paraguay', 'Bella Vista', 'Bella Vista'],
])('a value that names no one division is kept as it is written: %s, %s', (country, recorded, division) => {
    expect(admin1AreaOf(country, recorded)).toBe(division);
});

test.each([
    ['USA', 'Dallas Co. TX', 'Texas'],
    ['USA', 'Albuquerque NM', 'New Mexico'],
    ['USA', 'Washington Co', 'Washington Co'],
])(
    'a postal code beside a town names the state, a county abbreviation does not: %s, %s',
    (country, recorded, division) => {
        expect(admin1AreaOf(country, recorded)).toBe(division);
    },
);

test('a country keeps every name it is recorded under', () => {
    expect(canonicalCountryOf('Zaire')).toBe('Democratic Republic of the Congo');
    expect(canonicalCountryOf('East Timor')).toBe('Timor-Leste');
    expect(canonicalCountryOf('Viet Nam')).toBe('Viet Nam');
    expect(countryNamesOf('Timor-Leste')).toEqual(['Timor-Leste', 'East Timor']);
    expect(countryNamesOf('East Timor')).toEqual(['Timor-Leste', 'East Timor']);
    expect(countryNamesOf('Serbia').sort()).toEqual(['Serbia']);
    expect(countryNamesOf('South Korea')).toEqual(['South Korea']);
    for (const place of ['Korea', 'Borneo', 'Serbia and Montenegro', 'Yugoslavia', 'Netherlands Antilles']) {
        expect(placedCountryOf(place)).toBeUndefined();
        expect(continentOf(place)).toBeDefined();
    }
    expect(countryNamesOf('Nigeria')).toEqual(['Nigeria']);
});

test('a division of a country is told apart from a value kept as it was recorded', () => {
    expect(isAdmin1Of('Brazil', admin1AreaOf('Brazil', 'RJ'))).toBe(true);
    expect(isAdmin1Of('Brazil', admin1AreaOf('Brazil', 'Valença'))).toBe(false);
    expect(isAdmin1Of('USA', admin1AreaOf('USA', 'Dallas Co. TX'))).toBe(true);
    expect(isAdmin1Of('USA', admin1AreaOf('USA', 'Washington Co'))).toBe(false);
    expect(isAdmin1Of('Viet Nam', admin1AreaOf('Viet Nam', 'South'))).toBe(false);
    expect(isAdmin1Of('Chile', admin1AreaOf('Chile', 'Easter Island'))).toBe(false);
    expect(isAdmin1Of('Uganda', admin1AreaOf('Uganda', 'Mulago'))).toBe(true);
    for (const [country, recorded] of [
        ['Uganda', 'Hoima'],
        ['Nepal', 'Janakpur Zone'],
        ['Madagascar', 'Vatovavy-Fitovinany'],
        ['Viet Nam', 'Red River Delta'],
        ['Brazil', 'Manaus, Bahia'],
        ['USA', 'Somewhere in the Midwest'],
    ]) {
        expect(isAdmin1Of(country, admin1AreaOf(country, recorded))).toBe(false);
    }
    expect(isAdmin1Of('Argentina', admin1AreaOf('Argentina', 'Buenos Aires'))).toBe(false);
    expect(hasAdmin1Names('Ghana')).toBe(false);
    expect(isAdmin1Of('Ghana', 'Ashanti')).toBe(false);
    expect(hasAdmin1Names('Brazil')).toBe(true);
});

test('an address names a place by the name it is counted under', () => {
    expect(parsePlace('country:Zaire')).toEqual({ level: 'country', country: 'Democratic Republic of the Congo' });
    expect(parsePlace('country:New Delhi')).toEqual({ level: 'country', country: 'India' });
    expect(parsePlace('admin1:Brazil/Sao Paulo')).toEqual(parsePlace('admin1:Brazil/São Paulo'));
    expect(parsePlace('admin1:USA/Dallas Co. TX')).toEqual({ level: 'admin1', country: 'USA', admin1: 'Texas' });
    expect(parsePlace('admin1:Brazil/')).toBeUndefined();
    expect(parsePlace('country:')).toBeUndefined();
});
