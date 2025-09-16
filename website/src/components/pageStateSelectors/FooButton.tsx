import React from "react";
import { useState } from "react";

export default function FooBarButton() {
    const [label, setLabel] = useState("foo");

    return (
        <button onClick={() => setLabel("bar")}>
            {label}
        </button>
    );
}
