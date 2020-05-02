import React from 'react'
import { BrowserRouter, Link, Redirect, Route, Switch } from 'react-router-dom'

import ShareableIcon from './icons/shareable.svg'
import { DropPage } from './pages/DropPage'
import { PickUpPage } from './pages/PickUpPage'

export const App = () => (
    <div className="mx-auto px-4 max-w-md">
        <BrowserRouter>
            <div className="my-3">
                <div className="flex items-center ">
                    <ShareableIcon className="h-10 fill-current pr-2" />
                    <Link
                        className="text-4xl font-bold hover:text-gray-700"
                        to="/"
                    >
                        Cloud Drop
                    </Link>
                </div>
                <div className="text-sm">
                    Realtime P2P file sharing with WebRTC
                </div>
            </div>
            <Switch>
                <Route path="/" exact>
                    <Redirect to="/drop" />
                </Route>
                <Route path="/drop" component={DropPage} />
                <Route path="/pickup/:id" component={PickUpPage} />
            </Switch>
        </BrowserRouter>
    </div>
)
