import 'preact/debug';
import register from 'preact-custom-element';
import { LocationFilter } from './LocationFilter';

console.log(JSON.stringify(LocationFilter));

LocationFilter.propTypes = {
    fields: Array, // you can use PropTypes, or this
    value: String, // trick to define un-typed props.
};

register(LocationFilter, 'gs-location-filter2', ['fields', 'value'], { shadow: true });
